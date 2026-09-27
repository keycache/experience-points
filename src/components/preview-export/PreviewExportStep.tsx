import { useState } from 'react';
import type { ChangeEvent } from 'react';
import { useAppState } from '../../state/AppContext';
import { ResumeDocument } from '../resume-document/ResumeDocument';
import { downloadResumePdf } from '../../services/pdf/generateResumePdf';
import { downloadCoverLetterPdf } from '../../services/pdf/generateCoverLetterPdf';
import type { PageCountPreference } from '../../schemas/resume';

type PdfExportState = { status: 'idle' } | { status: 'loading' } | { status: 'error'; message: string };

/** Reasonable, offerable page-count targets (specification.md section 15). */
const PAGE_COUNT_OPTIONS: ReadonlyArray<{ value: string; label: string }> = [
  { value: 'no-preference', label: 'No preference' },
  { value: '1', label: '1 page' },
  { value: '2', label: '2 pages' },
  { value: '3', label: '3 pages' },
  { value: '4', label: '4 pages' },
  { value: '5', label: '5 pages' },
];

function pageCountPreferenceToOptionValue(preference: PageCountPreference): string {
  return preference === 'no-preference' ? 'no-preference' : String(preference);
}

/**
 * Content for the "Preview / Export" workflow step.
 *
 * Live preview (plan.md Stage 11) renders the same structured Resume
 * data using the same `resolveResumeLayout` pipeline that PDF export
 * (plan.md Stage 12) reuses, so the two stay visually consistent
 * (specification.md section 3.4). The page-length preference selector
 * (plan.md Stage 13) edits `resume.constraints.pageCountPreference`,
 * which that shared pipeline consults to decide how (and whether) to
 * compress the layout to fit the requested number of pages.
 *
 * PDF export runs entirely client-side: no network request is made,
 * and no application backend is involved.
 */
export function PreviewExportStep() {
  const { state, dispatch } = useAppState();
  const { resume, coverLetter } = state;
  const [pdfExportState, setPdfExportState] = useState<PdfExportState>({ status: 'idle' });
  const [coverLetterPdfExportState, setCoverLetterPdfExportState] = useState<PdfExportState>({
    status: 'idle',
  });

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

  async function handleDownloadCoverLetterPdf() {
    if (!coverLetter) {
      return;
    }
    setCoverLetterPdfExportState({ status: 'loading' });
    try {
      await downloadCoverLetterPdf(coverLetter);
      setCoverLetterPdfExportState({ status: 'idle' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to generate PDF.';
      setCoverLetterPdfExportState({ status: 'error', message });
    }
  }

  function handlePageCountPreferenceChange(event: ChangeEvent<HTMLSelectElement>) {
    if (!resume) {
      return;
    }
    const value = event.target.value;
    const pageCountPreference: PageCountPreference =
      value === 'no-preference' ? 'no-preference' : Number(value);
    dispatch({
      type: 'SET_RESUME',
      payload: { ...resume, constraints: { ...resume.constraints, pageCountPreference } },
    });
  }

  return (
    <div className="preview-export-step">
      <h2>Preview / Export</h2>
      {resume ? (
        <>
          <div className="preview-export-step__actions">
            <label htmlFor="page-count-preference" className="preview-export-step__page-count-label">
              Page length
            </label>
            <select
              id="page-count-preference"
              value={pageCountPreferenceToOptionValue(resume.constraints.pageCountPreference)}
              onChange={handlePageCountPreferenceChange}
            >
              {PAGE_COUNT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={pdfExportState.status === 'loading'}
              aria-busy={pdfExportState.status === 'loading'}
            >
              {pdfExportState.status === 'loading' ? 'Generating PDF…' : 'Download PDF'}
            </button>
            {coverLetter && (
              <button
                type="button"
                onClick={handleDownloadCoverLetterPdf}
                disabled={coverLetterPdfExportState.status === 'loading'}
                aria-busy={coverLetterPdfExportState.status === 'loading'}
              >
                {coverLetterPdfExportState.status === 'loading'
                  ? 'Generating Cover Letter PDF…'
                  : 'Download Cover Letter PDF'}
              </button>
            )}
          </div>
          {pdfExportState.status === 'error' && (
            <div role="alert" className="career-profile-input-form__error">
              <p>{pdfExportState.message}</p>
              <button type="button" onClick={handleDownloadPdf}>
                Retry
              </button>
            </div>
          )}
          {coverLetterPdfExportState.status === 'error' && (
            <div role="alert" className="career-profile-input-form__error">
              <p>{coverLetterPdfExportState.message}</p>
              <button type="button" onClick={handleDownloadCoverLetterPdf}>
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

