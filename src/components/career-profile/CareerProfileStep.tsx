import { useState } from 'react';
import { createLLMClient } from '../../clients/llm/createLLMClient';
import { extractCareerProfile } from '../../services/career-profile/extractCareerProfile';
import { downloadArtifact, CAREER_PROFILE_ARTIFACT } from '../../services/import-export/artifacts';
import { useAppState } from '../../state/AppContext';
import type { CareerProfile } from '../../schemas/careerProfile';
import { toGenerationErrorState, type GenerationState } from '../../utils/generationState';
import { CareerProfileInputForm, type CareerProfileGenerateInput } from './CareerProfileInputForm';
import { CareerProfileEditor } from './CareerProfileEditor';

/**
 * Content for the "Career Profile" workflow step (plan.md Stage 5).
 *
 * ```text
 * Raw text/images
 *      ↓
 * extract-career-profile prompt
 *      ↓
 * LLMClient
 *      ↓
 * Zod validation
 *      ↓
 * Career Profile
 * ```
 */
export function CareerProfileStep() {
  const { state, dispatch } = useAppState();
  const [generationState, setGenerationState] = useState<GenerationState>({ status: 'idle' });
  const profile = state.careerProfile;

  async function handleGenerate(input: CareerProfileGenerateInput) {
    setGenerationState({ status: 'loading' });
    try {
      const client = createLLMClient(state.llm);
      const result = await extractCareerProfile(client, {
        model: state.llm.model,
        rawText: input.rawText,
        additionalDetails: input.additionalDetails,
        images: input.images,
        existingProfile: profile,
      });
      dispatch({ type: 'SET_CAREER_PROFILE', payload: result });
      setGenerationState({ status: 'idle' });
    } catch (error) {
      setGenerationState(toGenerationErrorState(error, 'Failed to generate Career Profile.'));
    }
  }

  function handleImportProfile(imported: CareerProfile) {
    dispatch({ type: 'SET_CAREER_PROFILE', payload: imported });
    setGenerationState({ status: 'idle' });
  }

  return (
    <div className="career-profile-step">
      <h2>Career Profile</h2>
      <CareerProfileInputForm
        hasExistingProfile={Boolean(profile)}
        generationState={generationState}
        onGenerate={handleGenerate}
        onImportProfile={handleImportProfile}
      />

      {profile ? (
        <>
          <CareerProfileEditor
            profile={profile}
            onChange={(next) => dispatch({ type: 'SET_CAREER_PROFILE', payload: next })}
          />
          <button
            type="button"
            className="career-profile-step__download"
            onClick={() => downloadArtifact(CAREER_PROFILE_ARTIFACT, profile)}
          >
            Download Career Profile JSON
          </button>
        </>
      ) : (
        <p>No Career Profile yet. Paste some raw information above and generate one.</p>
      )}
    </div>
  );
}
