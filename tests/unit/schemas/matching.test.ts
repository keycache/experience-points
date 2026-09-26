import { describe, expect, it } from 'vitest';
import { MatchingAnalysisSchema } from '../../../src/schemas/matching';

describe('MatchingAnalysisSchema', () => {
  it('accepts a full matching analysis', () => {
    const result = MatchingAnalysisSchema.safeParse({
      importantRequirements: ['5+ years with Terraform'],
      relevantExperienceIds: ['exp-1'],
      importantTechnologies: ['Terraform', 'AWS'],
      equivalentTechnologies: [
        { jdTechnology: 'Terraform', profileTechnology: 'OpenTofu', rationale: 'Same HCL API' },
      ],
      missingEvidence: ['Kubernetes'],
      suggestedOrdering: ['exp-1'],
      suggestedSkills: ['Terraform'],
    });

    expect(result.success).toBe(true);
  });

  it('defaults every section to an empty array when omitted', () => {
    const result = MatchingAnalysisSchema.safeParse({});

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.missingEvidence).toEqual([]);
      expect(result.data.equivalentTechnologies).toEqual([]);
    }
  });

  it('rejects an equivalent technology entry missing required fields', () => {
    const result = MatchingAnalysisSchema.safeParse({
      equivalentTechnologies: [{ jdTechnology: 'Terraform' }],
    });

    expect(result.success).toBe(false);
  });
});
