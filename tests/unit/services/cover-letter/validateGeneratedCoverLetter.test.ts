import { describe, expect, it } from 'vitest';
import {
  assertCoverLetterMeetsGenerationConstraints,
  countWords,
  CoverLetterGenerationValidationError,
  MAX_TOTAL_BODY_WORDS,
} from '../../../../src/services/cover-letter/validateGeneratedCoverLetter';
import { CoverLetterSchema, type CoverLetter } from '../../../../src/schemas/coverLetter';

function buildCoverLetter(bodyParagraphs: string[]): CoverLetter {
  return CoverLetterSchema.parse({
    salutation: 'Dear Hiring Manager,',
    bodyParagraphs,
    closing: 'Sincerely,',
    senderContact: { fullName: 'Jamie Rivera', otherLinks: [] },
  });
}

describe('countWords', () => {
  it('counts words separated by whitespace', () => {
    expect(countWords('one two three')).toBe(3);
  });

  it('returns 0 for empty/whitespace-only text', () => {
    expect(countWords('   ')).toBe(0);
  });
});

describe('assertCoverLetterMeetsGenerationConstraints', () => {
  it('does not throw for a short, well-under-a-page cover letter', () => {
    const coverLetter = buildCoverLetter([
      'I am excited to apply for this role given my background in platform engineering.',
      'At my current company I led a major infrastructure migration with measurable impact.',
      'I would welcome the opportunity to discuss how I can contribute to your team.',
    ]);

    expect(() => assertCoverLetterMeetsGenerationConstraints(coverLetter)).not.toThrow();
  });

  it('throws when total body word count exceeds the maximum (must never approach a full page)', () => {
    const words = Array.from({ length: MAX_TOTAL_BODY_WORDS + 50 }, () => 'word').join(' ');
    const coverLetter = buildCoverLetter([words]);

    expect(() => assertCoverLetterMeetsGenerationConstraints(coverLetter)).toThrow(
      CoverLetterGenerationValidationError,
    );
  });

  it('throws when a single paragraph is implausibly long, even if total word count is under the ceiling', () => {
    const longParagraph = Array.from({ length: 130 }, () => 'word').join(' ');
    const coverLetter = buildCoverLetter([longParagraph]);

    expect(() => assertCoverLetterMeetsGenerationConstraints(coverLetter)).toThrow(
      /exceeding the maximum of 120 words/,
    );
  });

  it('accumulates multiple violations into a single error message', () => {
    const longParagraph = Array.from({ length: 130 }, () => 'word').join(' ');
    const coverLetter = buildCoverLetter([longParagraph, longParagraph, longParagraph]);

    try {
      assertCoverLetterMeetsGenerationConstraints(coverLetter);
      expect.fail('Expected assertCoverLetterMeetsGenerationConstraints to throw');
    } catch (error) {
      expect(error).toBeInstanceOf(CoverLetterGenerationValidationError);
      const message = (error as Error).message;
      expect(message).toMatch(/Cover letter body is \d+ words, exceeding the maximum/);
      expect(message.match(/exceeding the maximum of 120 words/g)?.length).toBe(3);
    }
  });
});
