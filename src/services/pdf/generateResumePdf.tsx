import { pdf } from '@react-pdf/renderer';
import type { Resume } from '../../schemas/resume';
import type { ResumeTemplate } from '../../schemas/resumeTemplate';
import { DEFAULT_RESUME_TEMPLATE } from '../../components/resume-document/template';
import { ResumePdfDocument } from '../../components/resume-pdf/ResumePdfDocument';
import { downloadBlob } from '../../utils/downloads';

/**
 * Generates the Resume PDF entirely client-side (plan.md Stage 12;
 * specification.md section 3.4):
 *
 * ```text
 * Resume
 *   ↓
 * React PDF renderer
 *   ↓
 * Blob
 * ```
 *
 * No network request is made: `@react-pdf/renderer` renders directly
 * to a `Blob` in the browser using only the built-in Helvetica font,
 * which requires no external font file to be fetched.
 */
export async function generateResumePdfBlob(
  resume: Resume,
  template: ResumeTemplate = DEFAULT_RESUME_TEMPLATE,
): Promise<Blob> {
  return pdf(<ResumePdfDocument resume={resume} template={template} />).toBlob();
}

/** Generates the Resume PDF and triggers a browser download of it. */
export async function downloadResumePdf(
  resume: Resume,
  template: ResumeTemplate = DEFAULT_RESUME_TEMPLATE,
): Promise<void> {
  const blob = await generateResumePdfBlob(resume, template);
  downloadBlob('resume.pdf', blob);
}
