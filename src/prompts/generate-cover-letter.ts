import type { CareerProfile } from '../schemas/careerProfile';
import type { JobDescription } from '../schemas/jobDescription';
import type { MatchingAnalysis } from '../schemas/matching';
import type { Resume } from '../schemas/resume';
import type { LLMContent } from '../clients/llm/types';
import { buildWritingStyleContent, type ResolveWritingStyleInput } from './writing-style';

/**
 * Prompt 3 --- Cover Letter Generation (specification.md section 9.3).
 *
 * Input:
 * ```text
 * Structured Job Description
 * +
 * Career Profile (all sections except Experience)
 * +
 * Matching/selection information
 * +
 * Resolved Writing Style (explicit or extrapolated)
 * +
 * Resume (for tonal/content consistency)
 * ```
 *
 * The Career Profile's `experience` array is deliberately withheld
 * from this prompt for the same reason as Resume generation
 * (plan.md Stage 9): the model must ground every referenced
 * qualification in the already-tailored Resume (which only contains
 * user-selected experience) rather than the full, unfiltered Career
 * Profile history, so it cannot reference experience the user never
 * selected for this application.
 */

export interface GenerateCoverLetterPromptInput {
  careerProfile: CareerProfile;
  jobDescription: JobDescription;
  matching: MatchingAnalysis;
  resume: Resume;
  writingStyle: ResolveWritingStyleInput;
}

const SYSTEM_PROMPT = `You are generating a structured, concise "Cover Letter" for a resume-tailoring application, targeting a specific Job Description.

Follow these rules:
- Keep the letter short. A full page is too long. Target approximately 3-4 short paragraphs.
- Match the resolved writing style used for the Resume (see the writing style guidance below); the Resume and Cover Letter must read as though written by the same person in the same tone.
- Reference only the most relevant, high-impact qualifications rather than repeating the entire Resume. Do not restate every bullet.
- Only reference experience, employers, technologies, and accomplishments that appear in the supplied Resume below. Never fabricate or reference experience that is not present there.
- Do not invent evidence for requirements listed as missing evidence in the Matching Analysis.
- Write a short, appropriate salutation (e.g. "Dear Hiring Manager," if no recipient name is known, or "Dear {name}," if one is supplied).
- Write a short, appropriate closing (e.g. "Sincerely," or a tone-appropriate equivalent).
- Populate senderContact using the Resume's contact information exactly.
- Produce at most 4 body paragraphs, each a small number of short sentences. Do not pad the letter to fill more space.`;

function buildCareerProfileContext(careerProfile: CareerProfile) {
  const {
    personal,
    professionalSummarySource,
    skills,
    education,
    certifications,
    awards,
    publications,
    projects,
    volunteerExperience,
    professionalAffiliations,
    customSections,
  } = careerProfile;

  return {
    personal,
    professionalSummarySource,
    skills,
    education,
    certifications,
    awards,
    publications,
    projects,
    volunteerExperience,
    professionalAffiliations,
    customSections,
  };
}

export function buildGenerateCoverLetterPrompt(input: GenerateCoverLetterPromptInput): {
  systemPrompt: string;
  userContent: LLMContent[];
} {
  const careerProfileContext = buildCareerProfileContext(input.careerProfile);

  const userContent: LLMContent[] = [
    { type: 'text', text: `Job Description (JSON):\n${JSON.stringify(input.jobDescription)}` },
    {
      type: 'text',
      text: `Career Profile context, excluding Experience (JSON):\n${JSON.stringify(careerProfileContext)}`,
    },
    { type: 'text', text: `Matching Analysis (JSON):\n${JSON.stringify(input.matching)}` },
    {
      type: 'text',
      text: `Resume (JSON) — the only source of truth for experience/accomplishments referenced in the letter:\n${JSON.stringify(input.resume)}`,
    },
    buildWritingStyleContent(input.writingStyle),
  ];

  return { systemPrompt: SYSTEM_PROMPT, userContent };
}
