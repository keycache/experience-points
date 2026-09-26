import { z } from 'zod';

/**
 * Writing Style domain schema.
 *
 * See specification.md section 8.3 (Writing Style). Writing style is
 * optional input: `mode: "unspecified"` (the default) signals that the
 * application must extrapolate a reasonable style from the Career
 * Profile's years of experience, education level, and any free-form
 * self-reference details, rather than silently applying an arbitrary
 * generic tone. That extrapolation is a prompt/generation concern
 * (see Stage 7 and Stage 9 of plan.md) and is out of scope for this
 * schema, which only needs to represent the possible explicit inputs.
 */
export const WritingStyleSchema = z.object({
  mode: z.enum(['unspecified', 'raw', 'structured']).default('unspecified'),
  rawText: z.string().optional(),
  tone: z.string().optional(),
  voice: z.enum(['first-person', 'third-person']).optional(),
  formality: z.enum(['casual', 'neutral', 'formal']).optional(),
  notes: z.string().optional(),
});

export type WritingStyle = z.infer<typeof WritingStyleSchema>;
