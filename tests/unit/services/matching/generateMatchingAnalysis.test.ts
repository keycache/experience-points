import { describe, expect, it, vi } from 'vitest';
import { generateMatchingAnalysis } from '../../../../src/services/matching/generateMatchingAnalysis';
import type { LLMClient } from '../../../../src/clients/llm/types';
import { buildValidCareerProfile } from '../../schemas/fixtures';

function buildJobDescription() {
  return {
    metadata: { title: 'Senior Platform Engineer', company: 'Hooli', location: 'Remote' },
    summary: 'Own our cloud infrastructure.',
    responsibilities: [],
    requirements: ['5+ years with Terraform'],
    preferredQualifications: [],
    technologies: ['Python', 'Terraform', 'AWS', 'Kubernetes', 'GitHub Actions'],
    leadershipExpectations: [],
    domainSignals: [],
    otherSignals: [],
  };
}

function buildMatchingAnalysis() {
  return {
    importantRequirements: ['5+ years with Terraform'],
    relevantExperienceIds: ['exp-1'],
    importantTechnologies: ['Terraform', 'AWS'],
    equivalentTechnologies: [
      { jdTechnology: 'Terraform', profileTechnology: 'OpenTofu', rationale: 'Same HCL API' },
    ],
    missingEvidence: ['Kubernetes'],
    suggestedOrdering: ['exp-1'],
    suggestedSkills: ['Terraform'],
  };
}

function mockClient(resolvedValue: unknown): LLMClient {
  return { generateStructured: vi.fn().mockResolvedValue(resolvedValue) };
}

describe('generateMatchingAnalysis', () => {
  it('generates a Matching Analysis from a Career Profile and Job Description', async () => {
    const client = mockClient(buildMatchingAnalysis());
    const careerProfile = buildValidCareerProfile();

    const result = await generateMatchingAnalysis(client, {
      model: 'openai/gpt-4o',
      careerProfile,
      jobDescription: buildJobDescription(),
    });

    expect(result.relevantExperienceIds).toEqual(['exp-1']);
    expect(client.generateStructured).toHaveBeenCalledTimes(1);
  });

  it('includes both the Career Profile and Job Description in the request content', async () => {
    const client = mockClient(buildMatchingAnalysis());
    const careerProfile = buildValidCareerProfile();
    const jobDescription = buildJobDescription();

    await generateMatchingAnalysis(client, { model: 'openai/gpt-4o', careerProfile, jobDescription });

    const request = (client.generateStructured as ReturnType<typeof vi.fn>).mock.calls[0][0];
    const texts = request.userContent.map((part: { text: string }) => part.text);
    expect(texts.some((text: string) => text.includes(careerProfile.personal.fullName))).toBe(true);
    expect(texts.some((text: string) => text.includes(jobDescription.metadata.title))).toBe(true);
  });

  it('identifies equivalent technology opportunities (e.g. OpenTofu -> Terraform)', async () => {
    const client = mockClient(buildMatchingAnalysis());

    const result = await generateMatchingAnalysis(client, {
      model: 'openai/gpt-4o',
      careerProfile: buildValidCareerProfile(),
      jobDescription: buildJobDescription(),
    });

    expect(result.equivalentTechnologies).toContainEqual(
      expect.objectContaining({ jdTechnology: 'Terraform', profileTechnology: 'OpenTofu' }),
    );
  });

  it('reports missing evidence without fabricating it', async () => {
    const client = mockClient(buildMatchingAnalysis());

    const result = await generateMatchingAnalysis(client, {
      model: 'openai/gpt-4o',
      careerProfile: buildValidCareerProfile(),
      jobDescription: buildJobDescription(),
    });

    expect(result.missingEvidence).toContain('Kubernetes');
  });

  it('rejects an invalid matching analysis response (schema mismatch)', async () => {
    const client: LLMClient = {
      generateStructured: vi.fn().mockRejectedValue(new Error('Invalid structured output')),
    };

    await expect(
      generateMatchingAnalysis(client, {
        model: 'openai/gpt-4o',
        careerProfile: buildValidCareerProfile(),
        jobDescription: buildJobDescription(),
      }),
    ).rejects.toThrow(/invalid structured output/i);
  });
});
