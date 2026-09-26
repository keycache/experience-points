import type { LLMClient } from '../../clients/llm/types';
import { JobDescriptionSchema, type JobDescription } from '../../schemas/jobDescription';
import { buildExtractJobDescriptionPrompt } from '../../prompts/extract-job-description';

/**
 * Job Description extraction service (plan.md Stage 6).
 *
 * ```text
 * Raw text/images
 *      ↓
 * extract-job-description prompt
 *      ↓
 * LLMClient
 *      ↓
 * Zod validation (performed inside LLMClient.generateStructured)
 *      ↓
 * Job Description
 * ```
 *
 * Unlike Career Profile extraction, there is no merge behavior here:
 * each Job Description is tied to a single job posting.
 */
export interface ExtractJobDescriptionInput {
  model: string;
  rawText?: string;
  images?: { dataUrl: string; mimeType: string }[];
}

export async function extractJobDescription(
  client: LLMClient,
  input: ExtractJobDescriptionInput,
): Promise<JobDescription> {
  const { systemPrompt, userContent } = buildExtractJobDescriptionPrompt(input);

  return client.generateStructured({
    model: input.model,
    systemPrompt,
    userContent,
    schema: JobDescriptionSchema,
  });
}
