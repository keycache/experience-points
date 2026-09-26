import { describe, expect, it, vi } from 'vitest';
import { generateCoverLetter } from '../../../../src/services/cover-letter/generateCoverLetter';
import { CoverLetterGenerationValidationError } from '../../../../src/services/cover-letter/validateGeneratedCoverLetter';
import { CoverLetterSchema } from '../../../../src/schemas/coverLetter';
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
    equivalentTechnologies: [],
    missingEvidence: [],
    suggestedOrdering: ['exp-1'],
    suggestedSkills: ['Terraform'],
  };
}

function buildResume() {
  return ResumeSchema.parse({
    contact: { fullName: 'Jamie Rivera', email: 'jamie.rivera@example.com', otherLinks: [] },
    profileSummary: 'Platform engineer tailored for the Hooli role.',
    skills: ['Terraform'],
    experience: [
      {
        id: 'res-exp-1',
        company: 'Initech',
        role: 'Senior Platform Engineer',
        startDate: { month: 3, year: 2021 },
        isCurrent: true,
        bullets: [{ id: 'b1', text: 'Led migration of Terraform stacks to OpenTofu.' }],
      },
    ],
  });
}

function buildCoverLetterResponse(overrides: Record<string, unknown> = {}) {
  return {
    salutation: 'Dear Hiring Manager,',
    bodyParagraphs: [
      'I am excited to apply for the Senior Platform Engineer role at Hooli.',
      'At Initech, I led the migration of Terraform stacks to OpenTofu, directly relevant to your infrastructure needs.',
      'I would welcome the opportunity to bring this experience to your team.',
    ],
    closing: 'Sincerely,',
    senderContact: { fullName: 'Jamie Rivera', email: 'jamie.rivera@example.com', otherLinks: [] },
    ...overrides,
  };
}

function mockClient(resolvedValue: unknown): LLMClient {
  // Mirrors what a real `LLMClient.generateStructured` implementation
  // guarantees: the resolved value already satisfies the requested
  // schema (mirrors the pattern in generateResume.test.ts).
  return { generateStructured: vi.fn().mockResolvedValue(CoverLetterSchema.parse(resolvedValue)) };
}

describe('generateCoverLetter', () => {
  it('generates a CoverLetter from a Career Profile, Job Description, Matching Analysis, and Resume', async () => {
    const client = mockClient(buildCoverLetterResponse());

    const result = await generateCoverLetter(client, {
      model: 'openai/gpt-4o',
      careerProfile: buildValidCareerProfile(),
      jobDescription: buildJobDescription(),
      matching: buildMatching(),
      resume: buildResume(),
    });

    expect(result.salutation).toBe('Dear Hiring Manager,');
    expect(result.bodyParagraphs).toHaveLength(3);
    expect(client.generateStructured).toHaveBeenCalledTimes(1);
  });

  it('generates using a supplied Writing Style', async () => {
    const client = mockClient(buildCoverLetterResponse());

    await generateCoverLetter(client, {
      model: 'openai/gpt-4o',
      careerProfile: buildValidCareerProfile(),
      jobDescription: buildJobDescription(),
      matching: buildMatching(),
      resume: buildResume(),
      writingStyle: { mode: 'raw', rawText: 'Write in a bold, energetic voice.' },
    });

    const [request] = (client.generateStructured as ReturnType<typeof vi.fn>).mock.calls[0];
    const combined = request.userContent.map((part: { type: string; text?: string }) =>
      part.type === 'text' ? part.text : '',
    );
    expect(combined.join('\n')).toContain('Write in a bold, energetic voice.');
  });

  it('generates with no Writing Style, extrapolating one instead', async () => {
    const client = mockClient(buildCoverLetterResponse());

    await generateCoverLetter(client, {
      model: 'openai/gpt-4o',
      careerProfile: buildValidCareerProfile(),
      jobDescription: buildJobDescription(),
      matching: buildMatching(),
      resume: buildResume(),
    });

    const [request] = (client.generateStructured as ReturnType<typeof vi.fn>).mock.calls[0];
    const combined = request.userContent.map((part: { type: string; text?: string }) =>
      part.type === 'text' ? part.text : '',
    );
    expect(combined.join('\n')).toContain('No explicit writing style was provided');
  });

  it('always syncs senderContact from the Resume contact, ignoring whatever the model returned', async () => {
    const client = mockClient(
      buildCoverLetterResponse({
        senderContact: { fullName: 'Someone Else', email: 'wrong@example.com', otherLinks: [] },
      }),
    );

    const result = await generateCoverLetter(client, {
      model: 'openai/gpt-4o',
      careerProfile: buildValidCareerProfile(),
      jobDescription: buildJobDescription(),
      matching: buildMatching(),
      resume: buildResume(),
    });

    expect(result.senderContact.fullName).toBe('Jamie Rivera');
    expect(result.senderContact.email).toBe('jamie.rivera@example.com');
  });

  it('throws a CoverLetterGenerationValidationError when the generated letter is too long', async () => {
    const longParagraph = Array.from({ length: 150 }, () => 'word').join(' ');
    const client = mockClient(
      buildCoverLetterResponse({ bodyParagraphs: [longParagraph, longParagraph] }),
    );

    await expect(
      generateCoverLetter(client, {
        model: 'openai/gpt-4o',
        careerProfile: buildValidCareerProfile(),
        jobDescription: buildJobDescription(),
        matching: buildMatching(),
        resume: buildResume(),
      }),
    ).rejects.toBeInstanceOf(CoverLetterGenerationValidationError);
  });
});
