import { describe, expect, it } from 'vitest';
import { buildInitialMatchSelection } from '../../../../src/services/matching/selection';
import { buildValidCareerProfile } from '../../schemas/fixtures';

function buildMatchingAnalysis(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    importantRequirements: [],
    relevantExperienceIds: ['exp-1'],
    importantTechnologies: [],
    equivalentTechnologies: [],
    missingEvidence: [],
    suggestedOrdering: [],
    suggestedSkills: [],
    ...overrides,
  };
}

describe('buildInitialMatchSelection', () => {
  it('selects the AI-recommended experience ids for best-match mode', () => {
    const careerProfile = buildValidCareerProfile();

    const selection = buildInitialMatchSelection(buildMatchingAnalysis(), careerProfile, 'best-match');

    expect(selection).toEqual({ mode: 'best-match', selectedExperienceIds: ['exp-1'] });
  });

  it('also uses the AI recommendation as the starting point for manual mode', () => {
    const careerProfile = buildValidCareerProfile();

    const selection = buildInitialMatchSelection(buildMatchingAnalysis(), careerProfile, 'manual');

    expect(selection).toEqual({ mode: 'manual', selectedExperienceIds: ['exp-1'] });
  });

  it('filters out recommended ids that do not exist in the Career Profile', () => {
    const careerProfile = buildValidCareerProfile();

    const selection = buildInitialMatchSelection(
      buildMatchingAnalysis({ relevantExperienceIds: ['exp-1', 'exp-does-not-exist'] }),
      careerProfile,
      'best-match',
    );

    expect(selection.selectedExperienceIds).toEqual(['exp-1']);
  });
});
