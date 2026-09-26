import type { Experience } from '../../schemas/careerProfile';
import type { Resume, ResumeConstraints } from '../../schemas/resume';

/**
 * Post-generation validation for a Resume produced by the LLM.
 *
 * `ResumeSchema` (Stage 1) already structurally enforces a hard
 * maximum bullet count per role. It does not (and should not, since
 * the schema is also used for plain imports) enforce the "approximate"
 * per-bullet sentence-count guidance or "no fabricated experience"
 * rule from specification.md section 9.2 — those are generation-time
 * constraints, checked here so a violation surfaces as a normal,
 * retryable generation error (plan.md Stage 9).
 */
export class ResumeGenerationValidationError extends Error {
  constructor(violations: string[]) {
    super(`The generated resume did not meet generation constraints:\n${violations.join('\n')}`);
    this.name = 'ResumeGenerationValidationError';
  }
}

/** Rough sentence count for a piece of bullet text (splits on . ! ?). */
export function countSentences(text: string): number {
  const trimmed = text.trim();
  if (trimmed.length === 0) {
    return 0;
  }
  const matches = trimmed.match(/[^.!?]+[.!?]+(?=\s|$)|[^.!?]+$/g);
  return matches ? matches.length : 1;
}

function normalizeCompanyName(company: string): string {
  return company.trim().toLowerCase();
}

/**
 * Validates a generated Resume against the resume constraints and the
 * user's Career Profile experience selection.
 *
 * Throws `ResumeGenerationValidationError` (accumulating every
 * violation into a single readable message) if:
 * - Any role has more bullets than `constraints.maxBulletsPerRole`.
 * - Any bullet exceeds `constraints.maxSentencesPerBullet` sentences.
 * - Any resume Experience entry's company is not among the
 *   user-selected Career Profile experiences (i.e. fabricated or
 *   unselected experience).
 */
export function assertResumeMeetsGenerationConstraints(
  resume: Resume,
  constraints: ResumeConstraints,
  selectedExperiences: Experience[],
): void {
  const violations: string[] = [];
  const selectedCompanies = new Set(
    selectedExperiences.map((experience) => normalizeCompanyName(experience.company)),
  );

  for (const experience of resume.experience) {
    if (!selectedCompanies.has(normalizeCompanyName(experience.company))) {
      violations.push(
        `Resume includes an experience ("${experience.company}") that was not part of the selected Career Profile experience.`,
      );
    }

    if (experience.bullets.length > constraints.maxBulletsPerRole) {
      violations.push(
        `Role "${experience.company} — ${experience.role}" has ${experience.bullets.length} bullets, exceeding the maximum of ${constraints.maxBulletsPerRole}.`,
      );
    }

    for (const bullet of experience.bullets) {
      const sentenceCount = countSentences(bullet.text);
      if (sentenceCount > constraints.maxSentencesPerBullet) {
        violations.push(
          `A bullet in "${experience.company} — ${experience.role}" has ${sentenceCount} sentences, exceeding the maximum of ${constraints.maxSentencesPerBullet}: "${bullet.text}"`,
        );
      }
    }
  }

  if (violations.length > 0) {
    throw new ResumeGenerationValidationError(violations);
  }
}
