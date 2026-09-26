import type { LLMClient } from '../../clients/llm/types';
import type { CareerProfile } from '../../schemas/careerProfile';
import type { JobDescription } from '../../schemas/jobDescription';
import type { MatchingAnalysis } from '../../schemas/matching';
import type { WritingStyle } from '../../schemas/writingStyle';
import type { Resume } from '../../schemas/resume';
import { CoverLetterSchema, type CoverLetter } from '../../schemas/coverLetter';
import { buildGenerateCoverLetterPrompt } from '../../prompts/generate-cover-letter';
import { assertCoverLetterMeetsGenerationConstraints } from './validateGeneratedCoverLetter';

/**
 * Cover Letter generation service (plan.md Stage 14.5).
 *
 * ```text
 * Career Profile (excluding Experience)
 * Job Description
 * Matching Analysis
 * Resume (for tonal/content consistency and factual grounding)
 * Writing Style
 *      ↓
 * generate-cover-letter prompt
 *      ↓
 * LLMClient
 *      ↓
 * Zod validation (performed inside LLMClient.generateStructured)
 *      ↓
 * senderContact synced from the Resume's contact (deterministic, not
 * trusted from the model)
 *      ↓
 * Generation-constraint validation (length ceiling)
 *      ↓
 * CoverLetter
 * ```
 */
export interface GenerateCoverLetterInput {
  model: string;
  careerProfile: CareerProfile;
  jobDescription: JobDescription;
  matching: MatchingAnalysis;
  resume: Resume;
  writingStyle?: WritingStyle;
}

export async function generateCoverLetter(
  client: LLMClient,
  input: GenerateCoverLetterInput,
): Promise<CoverLetter> {
  const { systemPrompt, userContent } = buildGenerateCoverLetterPrompt({
    careerProfile: input.careerProfile,
    jobDescription: input.jobDescription,
    matching: input.matching,
    resume: input.resume,
    writingStyle: { writingStyle: input.writingStyle, careerProfile: input.careerProfile },
  });

  const result = await client.generateStructured({
    model: input.model,
    systemPrompt,
    userContent,
    schema: CoverLetterSchema,
  });

  // The Cover Letter's sender contact must exactly match the Resume's
  // contact (specification.md section 8.6: "Sender contact (reused
  // from Resume contact)") — this is enforced deterministically here
  // rather than trusted from the model's output, since the model could
  // otherwise paraphrase or drop fields.
  const coverLetter: CoverLetter = { ...result, senderContact: input.resume.contact };

  assertCoverLetterMeetsGenerationConstraints(coverLetter);

  return coverLetter;
}
