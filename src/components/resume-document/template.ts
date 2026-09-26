import { ResumeTemplateSchema, type ResumeTemplate } from '../../schemas/resumeTemplate';

/**
 * Explicit Resume visual template specification (plan.md Stage 11;
 * specification.md section 14, "PDF Resume Template").
 *
 * Centralizing fonts, dimensions, and spacing here (rather than
 * scattering magic numbers across components) is what lets the same
 * values drive both the live preview (this stage) and the PDF renderer
 * (Stage 12) consistently.
 *
 * Units are PDF points (1/72 inch), matching the convention used by
 * `@react-pdf/renderer` in Stage 12 and by `ResumeTemplateSchema`.
 */
export const DEFAULT_RESUME_TEMPLATE: ResumeTemplate = ResumeTemplateSchema.parse({
  id: 'default',
  name: 'Default Template',
});

/** US Letter page size in points (8.5in x 11in). */
export const PAGE_WIDTH_PT = 612;
export const PAGE_HEIGHT_PT = 792;

export function getContentWidthPt(template: ResumeTemplate = DEFAULT_RESUME_TEMPLATE): number {
  return PAGE_WIDTH_PT - template.marginsPt.left - template.marginsPt.right;
}

export function getContentHeightPt(template: ResumeTemplate = DEFAULT_RESUME_TEMPLATE): number {
  return PAGE_HEIGHT_PT - template.marginsPt.top - template.marginsPt.bottom;
}

/**
 * Converts PDF points to CSS pixels for on-screen preview rendering,
 * using the standard 96 CSS-px-per-inch / 72 pt-per-inch ratio.
 */
export function ptToPx(pt: number): number {
  return (pt * 96) / 72;
}
