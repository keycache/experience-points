import { useState } from 'react';
import { useAppState } from '../../state/AppContext';
import { ResumeDocument } from '../resume-document/ResumeDocument';
import { downloadResumePdf } from '../../services/pdf/generateResumePdf';

type PdfExportState = { status: 'idle' } | { status: 'loading' } | { status: 'error'; message: string };

/**
 * Content for the "Preview / Export" workflow step.
 *
 * Live preview (plan.md Stage 11) renders the same structured Resume
 * data using the same `paginateResume` pipeline that PDF export
 * (plan.md Stage 12) reuses, so the two stay visually consistent
 * (specification.md section 3.4).
 *
 * PDF export runs entirely client-side: no network request is made,
 * and no application backend is involved.
 */
export function PreviewExportStep() {
  const { state } = useAppState();
  const { resume } = state;
  const [pdfExportState, setPdfExportState] = useState<PdfExportState>({ status: 'idle' });

  async function handleDownloadPdf() {
    if (!resume) {
      return;
    }
    setPdfExportState({ status: 'loading' });
    try {
      await downloadResumePdf(resume);
      setPdfExportState({ status: 'idle' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to generate PDF.';
      setPdfExportState({ status: 'error', message });
    }
  }

  return (
    <div className="preview-export-step">
      <h2>Preview / Export</h2>
      {resume ? (
        <>
          <div className="preview-export-step__actions">
            <button type="button" onClick={handleDownloadPdf} disabled={pdfExportState.status === 'loading'}>
              {pdfExportState.status === 'loading' ? 'Generating PDF…' : 'Download PDF'}
            </button>
          </div>
          {pdfExportState.status === 'error' && (
            <div role="alert" className="career-profile-input-form__error">
              <p>{pdfExportState.message}</p>
              <button type="button" onClick={handleDownloadPdf}>
                Retry
              </button>
            </div>
          )}
          <div className="preview-export-step__preview">
            <ResumeDocument resume={resume} />
          </div>
        </>
      ) : (
        <p>No resume yet. Generate or import a Resume first.</p>
      )}
    </div>
  );
}
