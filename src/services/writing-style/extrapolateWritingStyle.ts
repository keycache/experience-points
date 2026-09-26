import type { CareerProfile, Education, Experience } from '../../schemas/careerProfile';

/**
 * Heuristics for extrapolating a writing style when the user leaves
 * Writing Style unspecified. See specification.md section 8.3: the
 * extrapolation considers years of experience, highest education
 * level, and any free-form self-reference details already present in
 * the Career Profile. Deliberately simple per plan.md Stage 7 ("Keep
 * this stage intentionally simple").
 */

function monthYearToMonthIndex(monthYear: { month: number; year: number }): number {
  return monthYear.year * 12 + monthYear.month;
}

/**
 * Sums the duration of every Experience entry (in whole years, rounded
 * down). Ongoing roles (`isCurrent`) are measured through the current
 * month. Overlapping roles are not de-duplicated; this is a rough
 * signal for tone calibration, not a payroll calculation.
 */
export function computeYearsOfExperience(
  experience: Experience[],
  referenceDate: Date = new Date(),
): number {
  const referenceMonthIndex = referenceDate.getFullYear() * 12 + (referenceDate.getMonth() + 1);

  const totalMonths = experience.reduce((sum, role) => {
    const startMonthIndex = monthYearToMonthIndex(role.startDate);
    const endMonthIndex = role.isCurrent
      ? referenceMonthIndex
      : role.endDate
        ? monthYearToMonthIndex(role.endDate)
        : startMonthIndex;

    return sum + Math.max(0, endMonthIndex - startMonthIndex);
  }, 0);

  return Math.floor(totalMonths / 12);
}

const EDUCATION_LEVEL_KEYWORDS: { level: string; rank: number; keywords: string[] }[] = [
  { level: 'Doctorate', rank: 4, keywords: ['phd', 'ph.d', 'doctor of', 'doctorate'] },
  { level: "Master's degree", rank: 3, keywords: ['master', 'msc', 'm.s.', 'mba', 'm.a.'] },
  { level: "Bachelor's degree", rank: 2, keywords: ['bachelor', 'bsc', 'b.s.', 'b.a.', 'ba '] },
  { level: 'Associate degree', rank: 1, keywords: ['associate', 'a.a.', 'a.s.'] },
];

/**
 * Returns a short human-readable label for the highest education level
 * found in the Career Profile (e.g. "Master's degree"), or `undefined`
 * if there is no education information to go on.
 */
export function computeHighestEducationLevel(education: Education[]): string | undefined {
  let best: { level: string; rank: number } | undefined;

  for (const entry of education) {
    const degreeText = (entry.degree ?? '').toLowerCase();
    const match = EDUCATION_LEVEL_KEYWORDS.find((candidate) =>
      candidate.keywords.some((keyword) => degreeText.includes(keyword)),
    );
    if (match && (!best || match.rank > best.rank)) {
      best = { level: match.level, rank: match.rank };
    }
  }

  if (best) {
    return best.level;
  }

  // No recognizable degree keyword, but some education is on file.
  const firstWithDegree = education.find((entry) => entry.degree);
  if (firstWithDegree?.degree) {
    return firstWithDegree.degree;
  }
  if (education.length > 0) {
    return `Education at ${education[0].institution}`;
  }
  return undefined;
}

export interface WritingStyleExtrapolationSummary {
  yearsOfExperience: number;
  highestEducationLevel?: string;
  selfReferenceDetails?: string;
}

/**
 * Gathers the signals used to extrapolate a writing style from a
 * Career Profile: years of experience, highest education level, and
 * any free-form self-reference details already captured on the
 * profile (`professionalSummarySource`, populated from the "Additional
 * details" field during Career Profile extraction — see Stage 5).
 */
export function summarizeCareerProfileForStyleExtrapolation(
  careerProfile: CareerProfile | undefined,
): WritingStyleExtrapolationSummary {
  if (!careerProfile) {
    return { yearsOfExperience: 0 };
  }

  return {
    yearsOfExperience: computeYearsOfExperience(careerProfile.experience),
    highestEducationLevel: computeHighestEducationLevel(careerProfile.education),
    selfReferenceDetails: careerProfile.professionalSummarySource,
  };
}
