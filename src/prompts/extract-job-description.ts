import type { LLMContent } from '../clients/llm/types';

/**
 * Job Description Extraction prompt.
 *
 * Not one of the two/three prompts explicitly named in
 * specification.md section 9, but required by plan.md Stage 6 to turn
 * raw JD text/images into a structured `JobDescription`. Follows the
 * same architectural rule as `extract-career-profile.ts`: this module
 * only builds the request; validation happens via
 * `LLMClient.generateStructured`'s schema parameter.
 */

export interface ExtractJobDescriptionPromptInput {
  rawText?: string;
  images?: { dataUrl: string; mimeType: string }[];
}

const SYSTEM_PROMPT = `You are extracting a structured "Job Description" for a resume-tailoring application.

Rules:
- Do not fabricate requirements, responsibilities, or technologies that are not supported by the supplied job posting.
- You may infer loosely and normalize wording for clarity, but only based on the supplied information.
- Separate distinct responsibilities/requirements/qualifications into individual array entries rather than one long paragraph.
- If a title/company/location is not clearly stated, use your best reasonable guess based on context, or a short placeholder if there is truly no signal.`;

export function buildExtractJobDescriptionPrompt(input: ExtractJobDescriptionPromptInput): {
  systemPrompt: string;
  userContent: LLMContent[];
} {
  const userContent: LLMContent[] = [];

  if (input.rawText && input.rawText.trim().length > 0) {
    userContent.push({ type: 'text', text: `Raw job description text:\n${input.rawText}` });
  }

  for (const image of input.images ?? []) {
    userContent.push({ type: 'image', dataUrl: image.dataUrl, mimeType: image.mimeType });
  }

  if (userContent.length === 0) {
    userContent.push({
      type: 'text',
      text: 'No raw information was provided. Return an empty Job Description with a placeholder title.',
    });
  }

  return { systemPrompt: SYSTEM_PROMPT, userContent };
}
