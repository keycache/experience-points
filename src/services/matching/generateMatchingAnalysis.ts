import type { LLMClient } from '../../clients/llm/types';
import type { CareerProfile } from '../../schemas/careerProfile';
import type { JobDescription } from '../../schemas/jobDescription';
import { MatchingAnalysisSchema, type MatchingAnalysis } from '../../schemas/matching';
import { buildGenerateMatchingAnalysisPrompt } from '../../prompts/generate-matching-analysis';

/**
 * Matching Analysis generation service (plan.md Stage 8).
 *
 * ```text
 * Career Profile
 *      +
 * Job Description
 *      ↓
 * generate-matching-analysis prompt
 *      ↓
 * LLMClient
 *      ↓
 * Zod validation (performed inside LLMClient.generateStructured)
 *      ↓
 * Matching Analysis
 * ```
 */
export interface GenerateMatchingAnalysisInput {
  model: string;
  careerProfile: CareerProfile;
  jobDescription: JobDescription;
}

export async function generateMatchingAnalysis(
  client: LLMClient,
  input: GenerateMatchingAnalysisInput,
): Promise<MatchingAnalysis> {
  const { systemPrompt, userContent } = buildGenerateMatchingAnalysisPrompt(input);

  return client.generateStructured({
    model: input.model,
    systemPrompt,
    userContent,
    schema: MatchingAnalysisSchema,
  });
}
