import type { Resume } from '../../schemas/resume';
import type { ResumeTemplate } from '../../schemas/resumeTemplate';
import { DEFAULT_RESUME_TEMPLATE } from '../../components/resume-document/template';
import { paginateResume, type ResumePage } from './paginateResume';

/**
 * Readability-preserving page-count compression tiers (plan.md Stage
 * 13; specification.md section 15, "PDF Layout Rules").
 *
 * Only template fields that BOTH renderers actually honor visually are
 * adjusted here: base font size, line height, and page margins. The
 * live preview (`resume-document/ResumeDocument.tsx`) applies these
 * three as inline styles, and the PDF renderer
 * (`resume-pdf/styles.ts`) applies them as real PDF point values, so a
 * pagination decision made from one of these tiers always matches what
 * is actually rendered in both places.
 *
 * `sectionSpacingPt`/`headingFontSizePt` are deliberately left
 * untouched: the live preview's CSS uses fixed `em`-based spacing for
 * headings/sections and does not react to those two fields, so
 * compressing them would make the pagination estimate diverge from
 * what the browser actually draws (causing visual overflow).
 *
 * Tiers are ordered from least to most aggressive. Every tier is still
 * a genuinely readable resume font (9-10pt), a normal single-spaced
 * line height, and a print-safe margin (never below 24pt / 1/3 inch) —
 * "never destroy readability merely to hit an exact page count."
 */
const COMPRESSION_TIERS: ReadonlyArray<{ baseFontSizePt: number; lineHeight: number; marginPt: number }> = [
  { baseFontSizePt: 10, lineHeight: 1.12, marginPt: 32 },
  { baseFontSizePt: 9.5, lineHeight: 1.05, marginPt: 28 },
  { baseFontSizePt: 9, lineHeight: 1, marginPt: 24 },
];

function applyCompressionTier(
  base: ResumeTemplate,
  tier: (typeof COMPRESSION_TIERS)[number],
): ResumeTemplate {
  return {
    ...base,
    baseFontSizePt: tier.baseFontSizePt,
    lineHeight: tier.lineHeight,
    marginsPt: {
      top: tier.marginPt,
      right: tier.marginPt,
      bottom: tier.marginPt,
      left: tier.marginPt,
    },
  };
}

/**
 * Resolves the `ResumeTemplate` to actually render/paginate with,
 * given the resume's `constraints.pageCountPreference`.
 *
 * - `'no-preference'` (the default): the base template is returned
 *   unchanged. No-preference mode never artificially compresses
 *   content.
 * - A specific page count: if the content already fits within that
 *   many pages using the base template, the base template is returned
 *   unchanged (there is nothing to compress, and padding it out to
 *   fill more pages would only add "excessive blank space"). Otherwise
 *   progressively more compact tiers are tried in order; the first
 *   tier whose resulting page count is within the target is used. If
 *   no tier reaches the target, the most compact (but still
 *   reasonable) tier is used as a best effort — the target is never
 *   hit by destroying readability.
 */
export function resolveResumeTemplate(
  resume: Resume,
  baseTemplate: ResumeTemplate = DEFAULT_RESUME_TEMPLATE,
): ResumeTemplate {
  const target = resume.constraints.pageCountPreference;
  if (target === 'no-preference') {
    return baseTemplate;
  }

  if (paginateResume(resume, baseTemplate).length <= target) {
    return baseTemplate;
  }

  let mostCompactTemplate = baseTemplate;
  for (const tier of COMPRESSION_TIERS) {
    const candidate = applyCompressionTier(baseTemplate, tier);
    mostCompactTemplate = candidate;
    if (paginateResume(resume, candidate).length <= target) {
      return candidate;
    }
  }

  return mostCompactTemplate;
}

export interface ResolvedResumeLayout {
  /** The template actually used to render/paginate — may be more compact than `baseTemplate`. */
  template: ResumeTemplate;
  pages: ResumePage[];
}

/**
 * Resolves both the template to render with and its resulting pages in
 * one call. Shared by the live preview and the PDF renderer so a page
 * count preference always produces identical layout decisions in both
 * places.
 */
export function resolveResumeLayout(
  resume: Resume,
  baseTemplate: ResumeTemplate = DEFAULT_RESUME_TEMPLATE,
): ResolvedResumeLayout {
  const template = resolveResumeTemplate(resume, baseTemplate);
  return { template, pages: paginateResume(resume, template) };
}
