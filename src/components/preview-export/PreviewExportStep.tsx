import { useAppState } from '../../state/AppContext';
import { ResumeDocument } from '../resume-document/ResumeDocument';

/**
 * Content for the "Preview / Export" workflow step (plan.md Stage 11).
 *
 * Renders the same structured Resume data using the same
 * `ResumeDocument`/pagination pipeline that Stage 12 will reuse for
 * client-side PDF generation (specification.md section 3.4).
 */
export function PreviewExportStep() {
  const { state } = useAppState();
  const { resume } = state;

  return (
    <div className="preview-export-step">
      <h2>Preview / Export</h2>
      {resume ? (
        <div className="preview-export-step__preview">
          <ResumeDocument resume={resume} />
        </div>
      ) : (
        <p>No resume yet. Generate or import a Resume first.</p>
      )}
    </div>
  );
}
