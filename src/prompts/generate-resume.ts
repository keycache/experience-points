import type { CareerProfile, Experience } from '../schemas/careerProfile';
import type { JobDescription } from '../schemas/jobDescription';
import type { MatchingAnalysis } from '../schemas/matching';
import type { ResumeConstraints } from '../schemas/resume';
import type { LLMContent } from '../clients/llm/types';
import { buildWritingStyleContent, type ResolveWritingStyleInput } from './writing-style';

/**
 * Prompt 2 --- Resume Generation (specification.md section 9.2).
 *
 * Input:
 * ```text
 * Structured Job Description
 * +
 * Career Profile (all sections except Experience)
 * +
 * User-selected Experience entries only
 * +
 * Matching/selection information
 * +
 * Resolved Writing Style (explicit or extrapolated)
 * +
 * Resume constraints
 * ```
 *
 * Only the user-selected Career Profile experience entries are
 * forwarded, rather than the whole profile, so the model has no
 * opportunity to include experience the user did not select for this
 * resume (plan.md Stage 8 selection modes; Stage 9 "no fabricated
 * experience").
 */

export interface GenerateResumePromptInput {
  careerProfile: CareerProfile;
  jobDescription: JobDescription;
  matching: MatchingAnalysis;
  selectedExperiences: Experience[];
  resumeConstraints: ResumeConstraints;
  writingStyle: ResolveWritingStyleInput;
}

const SYSTEM_PROMPT = `You are generating a structured, tailored "Resume" for a resume-tailoring application, targeting a specific Job Description.

Follow these rules:
- Tailor strongly toward the Job Description.
- Preserve factual grounding in the supplied Career Profile information. Never fabricate experience, employers, technologies, or accomplishments.
- Only include Experience entries corresponding to the "Selected Experience entries" provided below. Do not include any other employer/role, even if it appears elsewhere in the Career Profile context.
- Normalize equivalent technologies where reasonable and well-supported (see "Equivalent technology opportunities" in the Matching Analysis), preferring Job Description terminology when the candidate's experience genuinely supports it.
- Reorder accomplishments/bullets within each role by relevance and impact; the most impactful, relevant bullets should come first.
- Select and prioritize impactful, relevant skills, favoring ones supported by both the Job Description and the Career Profile (including equivalent technologies).
- Generate a Job-Description-specific profile summary; do not reuse a generic summary.
- Rewrite accomplishments into concise, high-impact resume bullets where appropriate.
- Do not invent evidence for requirements listed as missing evidence in the Matching Analysis.
- Produce no more than the maximum bullets per role specified in the Resume constraints below (typically 4-6).
- Keep each bullet to approximately the maximum sentence count specified in the Resume constraints below (typically 2-4 sentences); prefer concise, high-impact wording.
- Optimize terminology for ATS (Applicant Tracking System) compatibility without keyword stuffing.
- Populate every resume section supported by the schema when the Career Profile has relevant information for it (education, certifications, projects, awards, publications, volunteer experience, professional affiliations, custom sections).`;

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

export function buildGenerateResumePrompt(input: GenerateResumePromptInput): {
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
    {
      type: 'text',
      text: `Selected Experience entries (JSON) — only these may appear in the resume's Experience section:\n${JSON.stringify(input.selectedExperiences)}`,
    },
    { type: 'text', text: `Matching Analysis (JSON):\n${JSON.stringify(input.matching)}` },
    { type: 'text', text: `Resume constraints (JSON):\n${JSON.stringify(input.resumeConstraints)}` },
    buildWritingStyleContent(input.writingStyle),
  ];

  return { systemPrompt: SYSTEM_PROMPT, userContent };
}
