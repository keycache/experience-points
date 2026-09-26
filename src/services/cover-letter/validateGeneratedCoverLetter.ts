import type { CoverLetter } from '../../schemas/coverLetter';

/**
 * Post-generation validation for a Cover Letter produced by the LLM.
 *
 * `CoverLetterSchema` (Stage 1) already structurally caps the number of
 * body paragraphs. It does not (and should not, since the schema is
 * also used for plain imports) enforce the "approximate word/character
 * ceiling" length constraint from specification.md section 8.6 / 9.3
 * ("must be short... a full page is considered too long") — that is a
 * generation-time constraint, checked here so a violation surfaces as
 * a normal, retryable generation error (plan.md Stage 14.5), matching
 * the pattern already established for Resume generation (Stage 9).
 */
export class CoverLetterGenerationValidationError extends Error {
  constructor(violations: string[]) {
    super(`The generated cover letter did not meet generation constraints:\n${violations.join('\n')}`);
    this.name = 'CoverLetterGenerationValidationError';
  }
}

/** Rough word count for a piece of text (splits on whitespace). */
export function countWords(text: string): number {
  const trimmed = text.trim();
  if (trimmed.length === 0) {
    return 0;
  }
  return trimmed.split(/\s+/).length;
}

/**
 * A conservative ceiling on total body-paragraph word count. A typical
 * single-spaced page holds roughly 500-600 words; this cap is set well
 * below that so the letter can "never approach a full page" even
 * before accounting for salutation/closing/whitespace (plan.md Stage
 * 14.5's hard rule).
 */
export const MAX_TOTAL_BODY_WORDS = 300;

/**
 * Validates a generated Cover Letter against the length constraint.
 *
 * Throws `CoverLetterGenerationValidationError` (accumulating every
 * violation into a single readable message) if:
 * - The total word count across all body paragraphs exceeds
 *   `MAX_TOTAL_BODY_WORDS`.
 * - Any single body paragraph is implausibly long (over 120 words) —
 *   a sign the model wrote one long paragraph instead of several short
 *   ones, which reads as long even if the total word count is fine.
 */
export function assertCoverLetterMeetsGenerationConstraints(coverLetter: CoverLetter): void {
  const violations: string[] = [];

  const totalWords = coverLetter.bodyParagraphs.reduce(
    (sum, paragraph) => sum + countWords(paragraph),
    0,
  );
  if (totalWords > MAX_TOTAL_BODY_WORDS) {
    violations.push(
      `Cover letter body is ${totalWords} words, exceeding the maximum of ${MAX_TOTAL_BODY_WORDS} words (must stay well under a full page).`,
    );
  }

  const maxSingleParagraphWords = 120;
  coverLetter.bodyParagraphs.forEach((paragraph, index) => {
    const words = countWords(paragraph);
    if (words > maxSingleParagraphWords) {
      violations.push(
        `Body paragraph ${index + 1} is ${words} words, exceeding the maximum of ${maxSingleParagraphWords} words for a single short paragraph.`,
      );
    }
  });

  if (violations.length > 0) {
    throw new CoverLetterGenerationValidationError(violations);
  }
}
