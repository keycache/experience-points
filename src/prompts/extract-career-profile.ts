import type { CareerProfile } from '../schemas/careerProfile';
import type { LLMContent } from '../clients/llm/types';

/**
 * Prompt 1 --- Career Profile Extraction.
 *
 * See specification.md section 9.1. Input is raw professional text
 * and/or images, an optional free-form "additional details" note, and
 * an optional existing Career Profile to merge into (rather than
 * replace). Output is validated separately (see
 * services/career-profile/extractCareerProfile.ts) against
 * `CareerProfileSchema`.
 */

export interface ExtractCareerProfilePromptInput {
  rawText?: string;
  additionalDetails?: string;
  images?: { dataUrl: string; mimeType: string }[];
  existingProfile?: CareerProfile;
}

const SYSTEM_PROMPT = `You are extracting a structured "Career Profile" for a resume-tailoring application.

The Career Profile is a career knowledge base, not a resume: it should preserve substantially more detail than any single resume would contain (all roles, projects, accomplishments, skills, education, certifications, awards, publications, volunteer experience, professional affiliations, and any other relevant sections).

Rules:
- Do not fabricate employers, roles, dates, projects, or accomplishments that are not supported by the information provided.
- You may infer loosely and rewrite wording for clarity, but only based on the supplied information.
- Employment/education/etc. dates must be represented as separate month (1-12) and year numbers.
- Every object that requires an "id" field should contain any short non-empty placeholder string; the application will assign its own permanent identifiers afterward, so the exact value does not matter.
- If an existing Career Profile (as JSON) is supplied, treat this as a MERGE/UPDATE, not a replacement: preserve all existing information that is not contradicted by the new input, and add or update entries based on the newly supplied information. Do not silently delete existing information that is still valid.
- If no existing Career Profile is supplied, build a complete new Career Profile from the supplied information only.`;

export function buildExtractCareerProfilePrompt(input: ExtractCareerProfilePromptInput): {
  systemPrompt: string;
  userContent: LLMContent[];
} {
  const userContent: LLMContent[] = [];

  if (input.existingProfile) {
    userContent.push({
      type: 'text',
      text: `Existing Career Profile (JSON) to merge new information into:\n${JSON.stringify(input.existingProfile)}`,
    });
  }

  if (input.rawText && input.rawText.trim().length > 0) {
    userContent.push({ type: 'text', text: `Raw professional history provided by the user:\n${input.rawText}` });
  }

  if (input.additionalDetails && input.additionalDetails.trim().length > 0) {
    userContent.push({
      type: 'text',
      text: `Additional free-form details provided by the user:\n${input.additionalDetails}`,
    });
  }

  for (const image of input.images ?? []) {
    userContent.push({ type: 'image', dataUrl: image.dataUrl, mimeType: image.mimeType });
  }

  if (userContent.length === 0) {
    userContent.push({
      type: 'text',
      text: 'No raw information was provided. Return an empty Career Profile with a placeholder full name.',
    });
  }

  return { systemPrompt: SYSTEM_PROMPT, userContent };
}
