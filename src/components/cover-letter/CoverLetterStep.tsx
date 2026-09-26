import { useRef, useState, type ChangeEvent } from 'react';
import { createLLMClient } from '../../clients/llm/createLLMClient';
import { generateCoverLetter } from '../../services/cover-letter/generateCoverLetter';
import {
  downloadArtifact,
  parseArtifactJson,
  COVER_LETTER_ARTIFACT,
} from '../../services/import-export/artifacts';
import { readFileAsText, validateJsonFile } from '../../utils/files';
import { useAppState } from '../../state/AppContext';
import { CoverLetterEditor } from './CoverLetterEditor';

type GenerationState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; message: string };

/**
 * Content for the "Cover Letter" workflow step (plan.md Stage 14.5).
 *
 * Generation:
 * ```text
 * Career Profile (excluding Experience)
 * Job Description
 * Matching Analysis
 * Resume (for tonal/content consistency)
 * Writing Style
 *      ↓
 * generate-cover-letter prompt
 *      ↓
 * LLMClient
 *      ↓
 * Zod validation + generation-constraint validation (length ceiling)
 *      ↓
 * CoverLetter
 * ```
 *
 * Generation requires a Career Profile, Job Description, Matching
 * Analysis, and Resume (mirroring Resume generation's own
 * prerequisites, since the Cover Letter prompt reuses all of them) —
 * but importing a previously exported Cover Letter JSON always works,
 * even without any of those present (plan.md Stage 14's "resume-only
 * shortcut" pattern extended to the Cover Letter).
 */
export function CoverLetterStep() {
  const { state, dispatch } = useAppState();
  const [generationState, setGenerationState] = useState<GenerationState>({ status: 'idle' });
  const [importError, setImportError] = useState<string | null>(null);
  const importFileInputRef = useRef<HTMLInputElement>(null);
  const { careerProfile, jobDescription, matching, resume, writingStyle, coverLetter } = state;

  const prerequisitesMet = Boolean(careerProfile && jobDescription && matching && resume);
  const canGenerate = prerequisitesMet && generationState.status !== 'loading';

  async function handleGenerate() {
    if (!careerProfile || !jobDescription || !matching || !resume) {
      return;
    }
    setGenerationState({ status: 'loading' });
    try {
      const client = createLLMClient(state.llm);
      const result = await generateCoverLetter(client, {
        model: state.llm.model,
        careerProfile,
        jobDescription,
        matching,
        resume,
        writingStyle,
      });
      dispatch({ type: 'SET_COVER_LETTER', payload: result });
      setGenerationState({ status: 'idle' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to generate cover letter.';
      setGenerationState({ status: 'error', message });
    }
  }

  async function handleImportFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) {
      return;
    }

    const fileValidation = validateJsonFile(file);
    if (!fileValidation.valid) {
      setImportError(fileValidation.error ?? 'Invalid file.');
      return;
    }

    const text = await readFileAsText(file);
    const result = parseArtifactJson(text, COVER_LETTER_ARTIFACT);
    if (!result.success) {
      setImportError(result.error.message);
      return;
    }

    setImportError(null);
    dispatch({ type: 'SET_COVER_LETTER', payload: result.data });
  }

  return (
    <div className="cover-letter-step">
      <h2>Cover Letter</h2>

      {!prerequisitesMet && (
        <p>
          A Career Profile, a Job Description, a Matching Analysis, and a Resume are all required
          before a Cover Letter can be generated. You can still import a previously exported Cover
          Letter JSON below.
        </p>
      )}

      <div className="cover-letter-step__actions">
        <button type="button" onClick={handleGenerate} disabled={!canGenerate}>
          {generationState.status === 'loading'
            ? 'Generating…'
            : coverLetter
              ? 'Regenerate Cover Letter'
              : 'Generate Cover Letter'}
        </button>

        <button type="button" onClick={() => importFileInputRef.current?.click()}>
          Import Cover Letter&hellip;
        </button>
        <input
          ref={importFileInputRef}
          type="file"
          accept=".json,application/json"
          aria-label="Import Cover Letter file"
          className="visually-hidden-input"
          onChange={handleImportFile}
        />
      </div>

      {importError && (
        <p role="alert" className="career-profile-input-form__error">
          {importError}
        </p>
      )}

      {generationState.status === 'error' && (
        <div role="alert" className="career-profile-input-form__error">
          <p>{generationState.message}</p>
          <button type="button" onClick={handleGenerate}>
            Retry
          </button>
        </div>
      )}

      {coverLetter ? (
        <>
          <CoverLetterEditor
            coverLetter={coverLetter}
            onChange={(next) => dispatch({ type: 'SET_COVER_LETTER', payload: next })}
          />
          <button
            type="button"
            className="cover-letter-step__download"
            onClick={() => downloadArtifact(COVER_LETTER_ARTIFACT, coverLetter)}
          >
            Download Cover Letter JSON
          </button>
        </>
      ) : (
        <p>No cover letter yet. Cover letters are optional.</p>
      )}
    </div>
  );
}
