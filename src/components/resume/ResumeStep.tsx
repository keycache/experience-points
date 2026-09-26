import { useRef, useState, type ChangeEvent } from 'react';
import { createLLMClient } from '../../clients/llm/createLLMClient';
import { generateResume } from '../../services/resume/generateResume';
import {
  downloadArtifact,
  parseArtifactJson,
  RESUME_ARTIFACT,
} from '../../services/import-export/artifacts';
import { readFileAsText, validateJsonFile } from '../../utils/files';
import { useAppState } from '../../state/AppContext';
import { ResumeEditor } from './ResumeEditor';

type GenerationState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; message: string };

/**
 * Content for the "Resume" workflow step.
 *
 * Generation (plan.md Stage 9):
 * ```text
 * Career Profile
 * Job Description
 * Matching Analysis
 * User Selection
 * Writing Style
 *      ↓
 * generate-resume prompt
 *      ↓
 * LLMClient
 *      ↓
 * Zod validation + generation-constraint validation
 *      ↓
 * Resume
 * ```
 *
 * Editing, download, and import (plan.md Stage 10): the user has full
 * control over the generated Resume via `ResumeEditor`. Editing here
 * never modifies the Career Profile. Importing a Resume JSON file
 * always works, even without an LLM configured or a Career
 * Profile/Job Description present (this is also what Stage 14's
 * "Resume-only workflow" relies on).
 */
export function ResumeStep() {
  const { state, dispatch } = useAppState();
  const [generationState, setGenerationState] = useState<GenerationState>({ status: 'idle' });
  const [importError, setImportError] = useState<string | null>(null);
  const importFileInputRef = useRef<HTMLInputElement>(null);
  const { careerProfile, jobDescription, matching, matchSelection, writingStyle, resume } = state;

  const prerequisitesMet = Boolean(careerProfile && jobDescription && matching);
  const canGenerate = prerequisitesMet && generationState.status !== 'loading';

  async function handleGenerate() {
    if (!careerProfile || !jobDescription || !matching) {
      return;
    }
    setGenerationState({ status: 'loading' });
    try {
      const client = createLLMClient(state.llm);
      const result = await generateResume(client, {
        model: state.llm.model,
        careerProfile,
        jobDescription,
        matching,
        selectedExperienceIds: matchSelection?.selectedExperienceIds ?? [],
        writingStyle,
      });
      dispatch({ type: 'SET_RESUME', payload: result });
      setGenerationState({ status: 'idle' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to generate resume.';
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
    const result = parseArtifactJson(text, RESUME_ARTIFACT);
    if (!result.success) {
      setImportError(result.error.message);
      return;
    }

    setImportError(null);
    // Importing a valid structured Resume skips generation entirely
    // (specification.md section 13 / plan.md Stage 14).
    dispatch({ type: 'SET_RESUME', payload: result.data });
  }

  return (
    <div className="resume-step">
      <h2>Resume</h2>

      {!prerequisitesMet && (
        <p>
          A Career Profile, a Job Description, and a Matching Analysis are all required before a
          resume can be generated. You can still import a previously exported Resume JSON below.
        </p>
      )}

      <div className="resume-step__actions">
        <button type="button" onClick={handleGenerate} disabled={!canGenerate}>
          {generationState.status === 'loading'
            ? 'Generating…'
            : resume
              ? 'Regenerate Resume'
              : 'Generate Resume'}
        </button>

        <button type="button" onClick={() => importFileInputRef.current?.click()}>
          Import Resume&hellip;
        </button>
        <input
          ref={importFileInputRef}
          type="file"
          accept=".json,application/json"
          aria-label="Import Resume file"
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

      {resume ? (
        <>
          <ResumeEditor
            resume={resume}
            onChange={(next) => dispatch({ type: 'SET_RESUME', payload: next })}
          />
          <button
            type="button"
            className="resume-step__download"
            onClick={() => downloadArtifact(RESUME_ARTIFACT, resume)}
          >
            Download Resume JSON
          </button>
        </>
      ) : (
        <p>No resume yet.</p>
      )}
    </div>
  );
}
