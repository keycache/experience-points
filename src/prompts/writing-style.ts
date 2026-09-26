import type { CareerProfile } from '../schemas/careerProfile';
import type { WritingStyle } from '../schemas/writingStyle';
import type { LLMContent } from '../clients/llm/types';
import { summarizeCareerProfileForStyleExtrapolation } from '../services/writing-style/extrapolateWritingStyle';

/**
 * Resolves the Writing Style input for injection into the Resume
 * Generation and Cover Letter Generation prompts (specification.md
 * section 8.3, section 9.2, section 9.3).
 *
 * If the user supplied an explicit style (raw text or structured
 * fields), it is used directly. If not, the prompt instructs the model
 * to extrapolate a reasonable style from the Career Profile's years of
 * experience, highest education level, and any free-form
 * self-reference details — this is intentionally an instruction to the
 * model, not a hardcoded default tone applied by the application.
 */

export interface ResolveWritingStyleInput {
  writingStyle?: WritingStyle;
  careerProfile?: CareerProfile;
}

export function resolveWritingStyleInstruction(input: ResolveWritingStyleInput): string {
  const { writingStyle, careerProfile } = input;

  if (writingStyle?.mode === 'raw' && writingStyle.rawText?.trim()) {
    return `Writing style guidance (as provided by the user):\n${writingStyle.rawText.trim()}`;
  }

  if (writingStyle?.mode === 'structured') {
    const parts: string[] = [];
    if (writingStyle.tone) parts.push(`Tone: ${writingStyle.tone}`);
    if (writingStyle.voice) parts.push(`Voice: ${writingStyle.voice}`);
    if (writingStyle.formality) parts.push(`Formality: ${writingStyle.formality}`);
    if (writingStyle.notes) parts.push(`Additional notes: ${writingStyle.notes}`);

    if (parts.length > 0) {
      return `Writing style guidance (structured, as provided by the user):\n${parts.join('\n')}`;
    }
  }

  // No explicit style was supplied: instruct the model to extrapolate
  // one instead of silently applying a generic default tone.
  const summary = summarizeCareerProfileForStyleExtrapolation(careerProfile);
  const summaryLines = [
    `Years of experience (approximate): ${summary.yearsOfExperience}`,
    `Highest education level: ${summary.highestEducationLevel ?? 'unknown'}`,
    `Self-reference details provided by the user: ${summary.selfReferenceDetails ?? 'none provided'}`,
  ];

  return [
    'No explicit writing style was provided by the user.',
    'Extrapolate a reasonable, consistent writing style from the following signals rather than defaulting to a generic tone:',
    ...summaryLines,
    'Apply the resulting style consistently to both the Resume and any Cover Letter.',
  ].join('\n');
}

/** Wraps the resolved writing style instruction as request content for an LLM generation request. */
export function buildWritingStyleContent(input: ResolveWritingStyleInput): LLMContent {
  return { type: 'text', text: resolveWritingStyleInstruction(input) };
}
