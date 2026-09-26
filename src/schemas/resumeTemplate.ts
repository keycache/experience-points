import { z } from 'zod';

/**
 * Resume visual template configuration.
 *
 * See specification.md section 14 (PDF Resume Template) and section 15
 * (PDF Layout Rules). The initial application uses exactly one fixed
 * template; this schema exists so the template's visual rules (fonts,
 * spacing, margins) are explicit, testable data rather than being
 * scattered across React/PDF components. Full rendering behavior is
 * implemented in later stages (Stage 11 onward).
 */
export const ResumeTemplateSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  fontFamily: z.string().default('Helvetica'),
  baseFontSizePt: z.number().min(6).max(18).default(10),
  headingFontSizePt: z.number().min(8).max(24).default(13),
  marginsPt: z
    .object({
      top: z.number().min(0).default(36),
      right: z.number().min(0).default(36),
      bottom: z.number().min(0).default(36),
      left: z.number().min(0).default(36),
    })
    .default({ top: 36, right: 36, bottom: 36, left: 36 }),
  sectionSpacingPt: z.number().min(0).default(10),
  lineHeight: z.number().min(1).default(1.2),
});

export type ResumeTemplate = z.infer<typeof ResumeTemplateSchema>;
