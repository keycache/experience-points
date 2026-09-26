import type { LLMClient } from '../../clients/llm/types';
import { CareerProfileSchema, type CareerProfile } from '../../schemas/careerProfile';
import { buildExtractCareerProfilePrompt } from '../../prompts/extract-career-profile';
import { assignFreshIds } from './assignFreshIds';

/**
 * Career Profile extraction/merge service (plan.md Stage 5).
 *
 * ```text
 * Raw text/images
 *      +
 * Optional existing Career Profile
 *      ↓
 * extract-career-profile prompt
 *      ↓
 * LLMClient
 *      ↓
 * Zod validation (performed inside LLMClient.generateStructured)
 *      ↓
 * Career Profile (with freshly assigned ids)
 * ```
 *
 * This module depends only on the provider-neutral `LLMClient`
 * interface (specification.md section 5), never on a specific
 * provider.
 */
export interface ExtractCareerProfileInput {
  model: string;
  rawText?: string;
  additionalDetails?: string;
  images?: { dataUrl: string; mimeType: string }[];
  existingProfile?: CareerProfile;
}

export async function extractCareerProfile(
  client: LLMClient,
  input: ExtractCareerProfileInput,
): Promise<CareerProfile> {
  const { systemPrompt, userContent } = buildExtractCareerProfilePrompt(input);

  const result = await client.generateStructured({
    model: input.model,
    systemPrompt,
    userContent,
    schema: CareerProfileSchema,
  });

  return assignFreshIds(result);
}
