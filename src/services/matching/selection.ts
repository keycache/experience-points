import type { CareerProfile } from '../../schemas/careerProfile';
import type { MatchingAnalysis } from '../../schemas/matching';
import type { MatchSelection, MatchSelectionMode } from '../../state/AppState';

/**
 * Builds the initial experience selection for a given selection mode.
 *
 * For both modes, the starting point is the AI's recommendation
 * (`MatchingAnalysis.relevantExperienceIds`), filtered down to ids that
 * actually exist in the Career Profile (an LLM could otherwise
 * reference a stale/invalid id). "Best Match" always mirrors this
 * recommendation; "I'll Select" uses it only as a pre-checked starting
 * point that the user is free to change.
 */
export function buildInitialMatchSelection(
  matching: MatchingAnalysis,
  careerProfile: CareerProfile,
  mode: MatchSelectionMode,
): MatchSelection {
  const knownExperienceIds = new Set(careerProfile.experience.map((experience) => experience.id));
  const recommended = matching.relevantExperienceIds.filter((id) => knownExperienceIds.has(id));

  return { mode, selectedExperienceIds: recommended };
}
