import { describe, expect, it } from 'vitest';
import {
  CoverLetterEnvelopeSchema,
  CoverLetterSchema,
  MAX_COVER_LETTER_BODY_PARAGRAPHS,
} from '../../../src/schemas/coverLetter';

function buildValidCoverLetter() {
  return {
    recipient: { hiringManagerName: 'Taylor Chen', company: 'Hooli' },
    salutation: 'Dear Taylor Chen,',
    bodyParagraphs: [
      'I am excited to apply for the Senior Platform Engineer role at Hooli.',
      'In my current role I led a migration from Terraform to OpenTofu across 40 services.',
      'I would welcome the chance to bring this experience to your infrastructure team.',
    ],
    closing: 'Sincerely, Jamie Rivera',
    senderContact: { fullName: 'Jamie Rivera', email: 'jamie.rivera@example.com', otherLinks: [] },
  };
}

describe('CoverLetterSchema', () => {
  it('accepts a valid, short Cover Letter', () => {
    const result = CoverLetterSchema.safeParse(buildValidCoverLetter());

    expect(result.success).toBe(true);
  });

  it('rejects a Cover Letter with no body paragraphs', () => {
    const invalid = buildValidCoverLetter();
    invalid.bodyParagraphs = [];

    const result = CoverLetterSchema.safeParse(invalid);

    expect(result.success).toBe(false);
  });

  it('rejects a Cover Letter that exceeds the short-length paragraph cap', () => {
    const invalid = buildValidCoverLetter();
    invalid.bodyParagraphs = Array.from(
      { length: MAX_COVER_LETTER_BODY_PARAGRAPHS + 1 },
      (_, i) => `Paragraph number ${i}.`,
    );

    const result = CoverLetterSchema.safeParse(invalid);

    expect(result.success).toBe(false);
  });

  it('accepts a valid Cover Letter export envelope', () => {
    const envelope = {
      schema_version: '1.0',
      type: 'cover-letter',
      data: buildValidCoverLetter(),
    };

    const result = CoverLetterEnvelopeSchema.safeParse(envelope);

    expect(result.success).toBe(true);
  });
});
