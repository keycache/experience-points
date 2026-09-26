import { describe, expect, it, vi } from 'vitest';
import { generateResume } from '../../../../src/services/resume/generateResume';
import { ResumeGenerationValidationError } from '../../../../src/services/resume/validateGeneratedResume';
import { ResumeSchema } from '../../../../src/schemas/resume';
import type { LLMClient } from '../../../../src/clients/llm/types';
import { buildValidCareerProfile } from '../../schemas/fixtures';

function buildJobDescription() {
  return {
    metadata: { title: 'Senior Platform Engineer', company: 'Hooli', location: 'Remote' },
    summary: 'Own our cloud infrastructure.',
    responsibilities: [],
    requirements: ['5+ years with Terraform'],
    preferredQualifications: [],
    technologies: ['Python', 'Terraform', 'AWS'],
    leadershipExpectations: [],
    domainSignals: [],
    otherSignals: [],
  };
}

function buildMatching() {
  return {
    importantRequirements: ['5+ years with Terraform'],
    relevantExperienceIds: ['exp-1'],
    importantTechnologies: ['Terraform', 'AWS'],
    equivalentTechnologies: [
      { jdTechnology: 'Terraform', profileTechnology: 'OpenTofu', rationale: 'Same HCL API' },
    ],
    missingEvidence: ['Kubernetes'],
    suggestedOrdering: ['exp-1'],
    suggestedSkills: ['Terraform', 'Python'],
  };
}

function buildResumeResponse(overrides: Record<string, unknown> = {}) {
  return {
    contact: { fullName: 'Jamie Rivera', otherLinks: [] },
    profileSummary: 'Platform engineer tailored for Hooli Senior Platform Engineer role.',
    skills: ['Terraform', 'Python', 'AWS'],
    experience: [
      {
        id: 'llm-res-exp-1',
        company: 'Initech',
        role: 'Senior Platform Engineer',
        startDate: { month: 3, year: 2021 },
        isCurrent: true,
        bullets: [
          { id: 'b1', text: 'Led migration of Terraform stacks to OpenTofu, cutting licensing costs.' },
          { id: 'b2', text: 'Automated deployment pipelines, reducing release time by 40%.' },
        ],
      },
    ],
    education: [],
    certifications: [],
    projects: [],
    awards: [],
    publications: [],
    volunteerExperience: [],
    professionalAffiliations: [],
    customSections: [],
    ...overrides,
  };
}

function mockClient(resolvedValue: unknown): LLMClient {
  // Mirrors what a real `LLMClient.generateStructured` implementation
  // guarantees: the resolved value already satisfies the requested
  // schema, including any Zod defaults (e.g. `constraints`).
  return { generateStructured: vi.fn().mockResolvedValue(ResumeSchema.parse(resolvedValue)) };
}

describe('generateResume', () => {
  it('generates a Resume from a Career Profile, Job Description, and Matching Analysis', async () => {
    const client = mockClient(buildResumeResponse());
    const careerProfile = buildValidCareerProfile();

    const result = await generateResume(client, {
      model: 'openai/gpt-4o',
      careerProfile,
      jobDescription: buildJobDescription(),
      matching: buildMatching(),
      selectedExperienceIds: ['exp-1'],
    });

    expect(result.contact.fullName).toBe('Jamie Rivera');
    expect(client.generateStructured).toHaveBeenCalledTimes(1);
  });

  it('passes through the selected skills from the mocked response (skill selection)', async () => {
    const client = mockClient(buildResumeResponse({ skills: ['Terraform', 'Python', 'AWS'] }));

    const result = await generateResume(client, {
      model: 'openai/gpt-4o',
      careerProfile: buildValidCareerProfile(),
      jobDescription: buildJobDescription(),
      matching: buildMatching(),
      selectedExperienceIds: ['exp-1'],
    });

    expect(result.skills).toEqual(['Terraform', 'Python', 'AWS']);
  });

  it('passes through a JD-specific profile summary (summary generation)', async () => {
    const client = mockClient(
      buildResumeResponse({ profileSummary: 'Tailored specifically for the Hooli role.' }),
    );

    const result = await generateResume(client, {
      model: 'openai/gpt-4o',
      careerProfile: buildValidCareerProfile(),
      jobDescription: buildJobDescription(),
      matching: buildMatching(),
      selectedExperienceIds: ['exp-1'],
    });

    expect(result.profileSummary).toBe('Tailored specifically for the Hooli role.');
  });

  it('preserves the experience ordering from the mocked response (experience ordering)', async () => {
    const careerProfile = buildValidCareerProfile();
    careerProfile.experience.push({
      id: 'exp-2',
      company: 'Globex',
      role: 'Engineer',
      startDate: { month: 1, year: 2015 },
      endDate: { month: 1, year: 2020 },
      isCurrent: false,
      projects: [],
      technologies: [],
    });

    const client = mockClient(
      buildResumeResponse({
        experience: [
          buildResumeResponse().experience[0],
          {
            id: 'llm-res-exp-2',
            company: 'Globex',
            role: 'Engineer',
            startDate: { month: 1, year: 2015 },
            endDate: { month: 1, year: 2020 },
            isCurrent: false,
            bullets: [{ id: 'b3', text: 'Maintained legacy systems.' }],
          },
        ],
      }),
    );

    const result = await generateResume(client, {
      model: 'openai/gpt-4o',
      careerProfile,
      jobDescription: buildJobDescription(),
      matching: buildMatching(),
      selectedExperienceIds: ['exp-1', 'exp-2'],
    });

    expect(result.experience.map((experience) => experience.company)).toEqual(['Initech', 'Globex']);
  });

  it('includes the Matching Analysis equivalent technologies in the request content', async () => {
    const client = mockClient(buildResumeResponse());

    await generateResume(client, {
      model: 'openai/gpt-4o',
      careerProfile: buildValidCareerProfile(),
      jobDescription: buildJobDescription(),
      matching: buildMatching(),
      selectedExperienceIds: ['exp-1'],
    });

    const request = (client.generateStructured as ReturnType<typeof vi.fn>).mock.calls[0][0];
    const texts = request.userContent.map((part: { text: string }) => part.text);
    expect(texts.some((text: string) => text.includes('OpenTofu'))).toBe(true);
  });

  it('only forwards the selected Career Profile experience entries to the prompt', async () => {
    const careerProfile = buildValidCareerProfile();
    careerProfile.experience.push({
      id: 'exp-unselected',
      company: 'Unselected Co',
      role: 'Engineer',
      startDate: { month: 1, year: 2010 },
      endDate: { month: 1, year: 2015 },
      isCurrent: false,
      projects: [],
      technologies: [],
    });
    const client = mockClient(buildResumeResponse());

    await generateResume(client, {
      model: 'openai/gpt-4o',
      careerProfile,
      jobDescription: buildJobDescription(),
      matching: buildMatching(),
      selectedExperienceIds: ['exp-1'],
    });

    const request = (client.generateStructured as ReturnType<typeof vi.fn>).mock.calls[0][0];
    const texts = request.userContent.map((part: { text: string }) => part.text);
    const selectedExperienceBlock = texts.find((text: string) => text.includes('Selected Experience'));
    expect(selectedExperienceBlock).toContain('Initech');
    expect(selectedExperienceBlock).not.toContain('Unselected Co');
  });

  it('rejects a resume that fabricates/includes an unselected experience (missing experience omission)', async () => {
    const client = mockClient(
      buildResumeResponse({
        experience: [
          {
            id: 'llm-res-fab',
            company: 'Fabricated Corp',
            role: 'Engineer',
            startDate: { month: 1, year: 2020 },
            isCurrent: true,
            bullets: [{ id: 'b1', text: 'Did something fabricated.' }],
          },
        ],
      }),
    );

    await expect(
      generateResume(client, {
        model: 'openai/gpt-4o',
        careerProfile: buildValidCareerProfile(),
        jobDescription: buildJobDescription(),
        matching: buildMatching(),
        selectedExperienceIds: ['exp-1'],
      }),
    ).rejects.toBeInstanceOf(ResumeGenerationValidationError);
  });

  it('rejects a resume with a bullet exceeding the sentence-count constraint', async () => {
    const client = mockClient(
      buildResumeResponse({
        experience: [
          {
            id: 'llm-res-exp-1',
            company: 'Initech',
            role: 'Senior Platform Engineer',
            startDate: { month: 3, year: 2021 },
            isCurrent: true,
            bullets: [
              {
                id: 'b1',
                text: 'One. Two. Three. Four. Five.',
              },
            ],
          },
        ],
      }),
    );

    await expect(
      generateResume(client, {
        model: 'openai/gpt-4o',
        careerProfile: buildValidCareerProfile(),
        jobDescription: buildJobDescription(),
        matching: buildMatching(),
        selectedExperienceIds: ['exp-1'],
      }),
    ).rejects.toThrow(/exceeding the maximum/);
  });

  it('propagates an invalid structured output error from the LLM client (retryable)', async () => {
    const client: LLMClient = {
      generateStructured: vi.fn().mockRejectedValue(new Error('Invalid structured output')),
    };

    await expect(
      generateResume(client, {
        model: 'openai/gpt-4o',
        careerProfile: buildValidCareerProfile(),
        jobDescription: buildJobDescription(),
        matching: buildMatching(),
        selectedExperienceIds: ['exp-1'],
      }),
    ).rejects.toThrow(/invalid structured output/i);
  });

  it('assigns fresh, unique ids to the returned resume (schema validation passes)', async () => {
    const client = mockClient(buildResumeResponse());

    const result = await generateResume(client, {
      model: 'openai/gpt-4o',
      careerProfile: buildValidCareerProfile(),
      jobDescription: buildJobDescription(),
      matching: buildMatching(),
      selectedExperienceIds: ['exp-1'],
    });

    expect(result.experience[0].id).not.toBe('llm-res-exp-1');
    expect(result.experience[0].bullets[0].id).not.toBe('b1');
  });
});
