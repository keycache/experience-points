import { pdf } from '@react-pdf/renderer';
import type { CoverLetter } from '../../schemas/coverLetter';
import { CoverLetterPdfDocument } from '../../components/cover-letter-pdf/CoverLetterPdfDocument';
import { downloadBlob } from '../../utils/downloads';

/**
 * Generates the Cover Letter PDF entirely client-side (plan.md
 * Stage 14.5; specification.md section 3.4):
 *
 * ```text
 * CoverLetter
 *   ↓
 * React PDF renderer
 *   ↓
 * Blob
 * ```
 *
 * No network request is made, mirroring `generateResumePdfBlob`
 * (Stage 12).
 */
export async function generateCoverLetterPdfBlob(coverLetter: CoverLetter): Promise<Blob> {
  return pdf(<CoverLetterPdfDocument coverLetter={coverLetter} />).toBlob();
}

/** Generates the Cover Letter PDF and triggers a browser download of it. */
export async function downloadCoverLetterPdf(coverLetter: CoverLetter): Promise<void> {
  const blob = await generateCoverLetterPdfBlob(coverLetter);
  downloadBlob('cover-letter.pdf', blob);
}
