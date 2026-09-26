import type { CareerProfile } from '../schemas/careerProfile';
import type { JobDescription } from '../schemas/jobDescription';
import type { LLMContent } from '../clients/llm/types';

/**
 * Matching Analysis prompt (plan.md Stage 8).
 *
 * Not one of the two/three prompts explicitly named in
 * specification.md section 9, but required by section 10 (Matching
 * and Selection) and section 8.4 (Matching Analysis) to bridge Career
 * Profile + Job Description into the intermediate analysis consumed
 * by Resume Generation (Stage 9).
 */

export interface GenerateMatchingAnalysisPromptInput {
  careerProfile: CareerProfile;
  jobDescription: JobDescription;
}

const SYSTEM_PROMPT = `You are producing a "Matching Analysis" that bridges a candidate's Career Profile and a target Job Description for a resume-tailoring application.

Identify:
- importantRequirements: the most important JD requirements/qualifications to address.
- relevantExperienceIds: the "id" values of the Career Profile experience entries (top-level items in the "experience" array) that are most relevant and impactful for this JD. Only use ids that literally appear in the supplied Career Profile JSON.
- importantTechnologies: the technologies most worth emphasizing.
- equivalentTechnologies: pairs where a JD technology is not literally present in the Career Profile, but the candidate has genuinely equivalent/transferable experience (e.g. JD asks for Terraform, candidate has OpenTofu). Only include a pair when the equivalence is well supported; include a short rationale.
- missingEvidence: JD requirements/technologies with no supporting evidence anywhere in the Career Profile. Do not fabricate evidence to avoid listing something here.
- suggestedOrdering: the relevant experience ids in the order they should appear in a tailored resume (most relevant/impactful first), considering relevance, impact, recency, evidence of required technologies, and leadership/ownership.
- suggestedSkills: skills worth emphasizing on the tailored resume, prioritizing ones supported by both the JD and the Career Profile (including equivalent technologies).

Rules:
- Never fabricate experience, technologies, or accomplishments not supported by the Career Profile.
- Prefer literal JD terminology when the Career Profile supports it; only substitute equivalent terminology when justified.
- Keep the output focused and avoid an overly granular taxonomy of match types.`;

export function buildGenerateMatchingAnalysisPrompt(
  input: GenerateMatchingAnalysisPromptInput,
): { systemPrompt: string; userContent: LLMContent[] } {
  const userContent: LLMContent[] = [
    { type: 'text', text: `Career Profile (JSON):\n${JSON.stringify(input.careerProfile)}` },
    { type: 'text', text: `Job Description (JSON):\n${JSON.stringify(input.jobDescription)}` },
  ];

  return { systemPrompt: SYSTEM_PROMPT, userContent };
}
