import type { LLMClient } from '../../clients/llm/types';
import type { CareerProfile } from '../../schemas/careerProfile';
import type { JobDescription } from '../../schemas/jobDescription';
import type { MatchingAnalysis } from '../../schemas/matching';
import type { WritingStyle } from '../../schemas/writingStyle';
import { ResumeConstraintsSchema, ResumeSchema, type Resume } from '../../schemas/resume';
import { buildGenerateResumePrompt } from '../../prompts/generate-resume';
import { assignFreshResumeIds } from './assignFreshResumeIds';
import { assertResumeMeetsGenerationConstraints } from './validateGeneratedResume';

/**
 * Resume generation service (plan.md Stage 9).
 *
 * ```text
 * Career Profile (selected experience only)
 * Job Description
 * Matching Analysis
 * User Selection
 * Writing Style
 * Resume constraints
 *      ↓
 * generate-resume prompt
 *      ↓
 * LLMClient
 *      ↓
 * Zod validation (performed inside LLMClient.generateStructured)
 *      ↓
 * Generation-constraint validation (bullet/sentence counts, no
 * fabricated/unselected experience)
 *      ↓
 * Resume
 * ```
 */
export interface GenerateResumeInput {
  model: string;
  careerProfile: CareerProfile;
  jobDescription: JobDescription;
  matching: MatchingAnalysis;
  selectedExperienceIds: string[];
  writingStyle?: WritingStyle;
}

export async function generateResume(client: LLMClient, input: GenerateResumeInput): Promise<Resume> {
  const selectedExperiences = input.careerProfile.experience.filter((experience) =>
    input.selectedExperienceIds.includes(experience.id),
  );
  const resumeConstraints = ResumeConstraintsSchema.parse({});

  const { systemPrompt, userContent } = buildGenerateResumePrompt({
    careerProfile: input.careerProfile,
    jobDescription: input.jobDescription,
    matching: input.matching,
    selectedExperiences,
    resumeConstraints,
    writingStyle: { writingStyle: input.writingStyle, careerProfile: input.careerProfile },
  });

  const result = await client.generateStructured({
    model: input.model,
    systemPrompt,
    userContent,
    schema: ResumeSchema,
  });

  const resume = assignFreshResumeIds(result);
  assertResumeMeetsGenerationConstraints(resume, resume.constraints, selectedExperiences);

  return resume;
}
