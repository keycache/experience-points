import { useState } from 'react';
import { createLLMClient } from '../../clients/llm/createLLMClient';
import { generateMatchingAnalysis } from '../../services/matching/generateMatchingAnalysis';
import { buildInitialMatchSelection } from '../../services/matching/selection';
import { useAppState } from '../../state/AppContext';
import type { MatchSelectionMode } from '../../state/AppState';
import { MatchingAnalysisView } from './MatchingAnalysisView';
import { ExperienceSelectionList } from './ExperienceSelectionList';

type GenerationState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; message: string };

/**
 * Content for the "Match & Tailor" workflow step (plan.md Stage 8).
 *
 * ```text
 * Career Profile
 *      +
 * Job Description
 *      ↓
 * generate-matching-analysis prompt
 *      ↓
 * LLMClient
 *      ↓
 * Zod validation
 *      ↓
 * Matching Analysis
 * ```
 *
 * Selection modes (specification.md section 10):
 * - Best Match: the AI's recommendation is the selection.
 * - I'll Select: the user has final control, starting from the AI's
 *   recommendation as a suggestion.
 */
export function MatchTailorStep() {
  const { state, dispatch } = useAppState();
  const [generationState, setGenerationState] = useState<GenerationState>({ status: 'idle' });
  const { careerProfile, jobDescription, matching, matchSelection } = state;

  const canGenerate = Boolean(careerProfile && jobDescription) && generationState.status !== 'loading';

  async function handleGenerate() {
    if (!careerProfile || !jobDescription) {
      return;
    }
    setGenerationState({ status: 'loading' });
    try {
      const client = createLLMClient(state.llm);
      const result = await generateMatchingAnalysis(client, {
        model: state.llm.model,
        careerProfile,
        jobDescription,
      });
      dispatch({ type: 'SET_MATCHING', payload: result });
      dispatch({
        type: 'SET_MATCH_SELECTION',
        payload: buildInitialMatchSelection(result, careerProfile, matchSelection?.mode ?? 'best-match'),
      });
      setGenerationState({ status: 'idle' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to generate matching analysis.';
      setGenerationState({ status: 'error', message });
    }
  }

  function handleModeChange(mode: MatchSelectionMode) {
    if (!matching || !careerProfile) {
      return;
    }
    if (mode === 'best-match') {
      dispatch({ type: 'SET_MATCH_SELECTION', payload: buildInitialMatchSelection(matching, careerProfile, mode) });
    } else {
      dispatch({
        type: 'SET_MATCH_SELECTION',
        payload: { mode, selectedExperienceIds: matchSelection?.selectedExperienceIds ?? [] },
      });
    }
  }

  function handleToggleExperience(experienceId: string) {
    if (!matchSelection || matchSelection.mode !== 'manual') {
      return;
    }
    const isSelected = matchSelection.selectedExperienceIds.includes(experienceId);
    const nextSelectedIds = isSelected
      ? matchSelection.selectedExperienceIds.filter((id) => id !== experienceId)
      : [...matchSelection.selectedExperienceIds, experienceId];
    dispatch({
      type: 'SET_MATCH_SELECTION',
      payload: { mode: 'manual', selectedExperienceIds: nextSelectedIds },
    });
  }

  if (!careerProfile || !jobDescription) {
    return (
      <div className="match-tailor-step">
        <h2>Match &amp; Tailor</h2>
        <p>
          A Career Profile and a Job Description are both required before matching can run.
          Please complete those steps first.
        </p>
      </div>
    );
  }

  return (
    <div className="match-tailor-step">
      <h2>Match &amp; Tailor</h2>

      <button type="button" onClick={handleGenerate} disabled={!canGenerate}>
        {generationState.status === 'loading'
          ? 'Generating…'
          : matching
            ? 'Regenerate Matching Analysis'
            : 'Generate Matching Analysis'}
      </button>

      {generationState.status === 'error' && (
        <div role="alert" className="career-profile-input-form__error">
          <p>{generationState.message}</p>
          <button type="button" onClick={handleGenerate}>
            Retry
          </button>
        </div>
      )}

      {matching && (
        <>
          <MatchingAnalysisView matching={matching} careerProfile={careerProfile} />

          <fieldset className="list-editor">
            <legend>Selection mode</legend>
            <div className="match-tailor-step__mode-row">
              <input
                id="match-selection-mode-best-match"
                type="radio"
                name="match-selection-mode"
                checked={(matchSelection?.mode ?? 'best-match') === 'best-match'}
                onChange={() => handleModeChange('best-match')}
              />
              <label htmlFor="match-selection-mode-best-match">Best Match</label>
            </div>
            <div className="match-tailor-step__mode-row">
              <input
                id="match-selection-mode-manual"
                type="radio"
                name="match-selection-mode"
                checked={matchSelection?.mode === 'manual'}
                onChange={() => handleModeChange('manual')}
              />
              <label htmlFor="match-selection-mode-manual">I&rsquo;ll Select</label>
            </div>
          </fieldset>

          <ExperienceSelectionList
            careerProfile={careerProfile}
            recommendedIds={matching.relevantExperienceIds}
            selectedIds={matchSelection?.selectedExperienceIds ?? []}
            editable={matchSelection?.mode === 'manual'}
            onToggle={handleToggleExperience}
          />
        </>
      )}
    </div>
  );
}
