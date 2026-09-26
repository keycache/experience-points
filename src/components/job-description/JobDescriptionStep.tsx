import { useState } from 'react';
import { createLLMClient } from '../../clients/llm/createLLMClient';
import { extractJobDescription } from '../../services/job-description/extractJobDescription';
import { downloadArtifact, JOB_DESCRIPTION_ARTIFACT } from '../../services/import-export/artifacts';
import { useAppState } from '../../state/AppContext';
import type { JobDescription } from '../../schemas/jobDescription';
import { toGenerationErrorState, type GenerationState } from '../../utils/generationState';
import { JobDescriptionInputForm, type JobDescriptionGenerateInput } from './JobDescriptionInputForm';
import { JobDescriptionEditor } from './JobDescriptionEditor';

/**
 * Content for the "Job Description" workflow step (plan.md Stage 6).
 *
 * ```text
 * Raw text/images
 *      ↓
 * extract-job-description prompt
 *      ↓
 * LLMClient
 *      ↓
 * Zod validation
 *      ↓
 * Job Description
 * ```
 *
 * Importing a valid structured JD JSON skips this pipeline entirely
 * (specification.md section 13).
 */
export function JobDescriptionStep() {
  const { state, dispatch } = useAppState();
  const [generationState, setGenerationState] = useState<GenerationState>({ status: 'idle' });
  const jobDescription = state.jobDescription;

  async function handleGenerate(input: JobDescriptionGenerateInput) {
    setGenerationState({ status: 'loading' });
    try {
      const client = createLLMClient(state.llm);
      const result = await extractJobDescription(client, {
        model: state.llm.model,
        rawText: input.rawText,
        images: input.images,
      });
      dispatch({ type: 'SET_JOB_DESCRIPTION', payload: result });
      setGenerationState({ status: 'idle' });
    } catch (error) {
      setGenerationState(toGenerationErrorState(error, 'Failed to generate Job Description.'));
    }
  }

  function handleImportJobDescription(imported: JobDescription) {
    dispatch({ type: 'SET_JOB_DESCRIPTION', payload: imported });
    setGenerationState({ status: 'idle' });
  }

  return (
    <div className="job-description-step">
      <h2>Job Description</h2>
      <JobDescriptionInputForm
        generationState={generationState}
        onGenerate={handleGenerate}
        onImportJobDescription={handleImportJobDescription}
      />

      {jobDescription ? (
        <>
          <JobDescriptionEditor
            jobDescription={jobDescription}
            onChange={(next) => dispatch({ type: 'SET_JOB_DESCRIPTION', payload: next })}
          />
          <button
            type="button"
            className="job-description-step__download"
            onClick={() => downloadArtifact(JOB_DESCRIPTION_ARTIFACT, jobDescription)}
          >
            Download Job Description JSON
          </button>
        </>
      ) : (
        <p>No Job Description yet. Paste a job description above and generate one.</p>
      )}
    </div>
  );
}
