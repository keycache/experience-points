import { useState } from 'react';
import { createLLMClient } from '../../clients/llm/createLLMClient';
import { generateResume } from '../../services/resume/generateResume';
import { useAppState } from '../../state/AppContext';
import { ResumeView } from './ResumeView';

type GenerationState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; message: string };

/**
 * Content for the "Resume" workflow step (plan.md Stage 9).
 *
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
 */
export function ResumeStep() {
  const { state, dispatch } = useAppState();
  const [generationState, setGenerationState] = useState<GenerationState>({ status: 'idle' });
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

  if (!prerequisitesMet) {
    return (
      <div className="resume-step">
        <h2>Resume</h2>
        <p>
          A Career Profile, a Job Description, and a Matching Analysis are all required before a
          resume can be generated. Please complete the Career Profile, Job Description, and Match
          &amp; Tailor steps first.
        </p>
      </div>
    );
  }

  return (
    <div className="resume-step">
      <h2>Resume</h2>

      <button type="button" onClick={handleGenerate} disabled={!canGenerate}>
        {generationState.status === 'loading'
          ? 'Generating…'
          : resume
            ? 'Regenerate Resume'
            : 'Generate Resume'}
      </button>

      {generationState.status === 'error' && (
        <div role="alert" className="career-profile-input-form__error">
          <p>{generationState.message}</p>
          <button type="button" onClick={handleGenerate}>
            Retry
          </button>
        </div>
      )}

      {resume ? (
        <ResumeView resume={resume} />
      ) : (
        <p>No resume generated yet.</p>
      )}
    </div>
  );
}
