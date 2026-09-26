import { z } from 'zod';
import { ContactInfoSchema, createExportEnvelopeSchema } from './common';

/**
 * Cover Letter domain schema.
 *
 * See specification.md section 8.6 (Cover Letter). The Cover Letter is
 * an optional companion artifact to the Resume and must stay short: a
 * full page is explicitly too long (plan.md Stage 14.5), so the body is
 * capped at a small number of short paragraphs.
 */

/** plan.md Stage 14.5: "Target: 3–4 short paragraphs". */
export const MAX_COVER_LETTER_BODY_PARAGRAPHS = 4;

export const CoverLetterRecipientSchema = z.object({
  hiringManagerName: z.string().optional(),
  company: z.string().optional(),
});

export type CoverLetterRecipient = z.infer<typeof CoverLetterRecipientSchema>;

export const CoverLetterSchema = z.object({
  recipient: CoverLetterRecipientSchema.optional(),
  salutation: z.string().min(1),
  bodyParagraphs: z
    .array(z.string().min(1))
    .min(1)
    .max(
      MAX_COVER_LETTER_BODY_PARAGRAPHS,
      `A cover letter must stay short: at most ${MAX_COVER_LETTER_BODY_PARAGRAPHS} body paragraphs`,
    ),
  closing: z.string().min(1),
  senderContact: ContactInfoSchema,
});

export type CoverLetter = z.infer<typeof CoverLetterSchema>;

export const CoverLetterEnvelopeSchema = createExportEnvelopeSchema(
  'cover-letter',
  CoverLetterSchema,
);

export type CoverLetterEnvelope = z.infer<typeof CoverLetterEnvelopeSchema>;
