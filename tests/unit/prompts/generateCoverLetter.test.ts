import { describe, expect, it } from 'vitest';
import { buildGenerateCoverLetterPrompt } from '../../../src/prompts/generate-cover-letter';
import { ResumeSchema } from '../../../src/schemas/resume';
import { buildValidCareerProfile } from '../schemas/fixtures';

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
    contact: { fullName: 'Jamie Rivera', email: 'jamie.rivera@example.com' },
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

describe('buildGenerateCoverLetterPrompt', () => {
  it('includes the Job Description, Matching Analysis, and Resume in the user content', () => {
    const { userContent } = buildGenerateCoverLetterPrompt({
      careerProfile: buildValidCareerProfile(),
      jobDescription: buildJobDescription(),
      matching: buildMatching(),
      resume: buildResume(),
      writingStyle: {},
    });

    const combined = userContent.map((part) => (part.type === 'text' ? part.text : '')).join('\n');
    expect(combined).toContain('Senior Platform Engineer');
    expect(combined).toContain('"suggestedSkills":["Terraform"]');
    expect(combined).toContain('Led migration of Terraform stacks to OpenTofu.');
  });

  it('excludes the Career Profile Experience array (only the Resume grounds referenced experience)', () => {
    const { userContent } = buildGenerateCoverLetterPrompt({
      careerProfile: buildValidCareerProfile(),
      jobDescription: buildJobDescription(),
      matching: buildMatching(),
      resume: buildResume(),
      writingStyle: {},
    });

    const careerProfilePart = userContent.find((part) =>
      part.type === 'text' ? part.text.includes('Career Profile context') : false,
    );
    expect(careerProfilePart).toBeDefined();
    if (careerProfilePart?.type === 'text') {
      expect(careerProfilePart.text).not.toContain('Infra Migration');
    }
  });

  it('injects an explicit writing style when supplied', () => {
    const { userContent } = buildGenerateCoverLetterPrompt({
      careerProfile: buildValidCareerProfile(),
      jobDescription: buildJobDescription(),
      matching: buildMatching(),
      resume: buildResume(),
      writingStyle: {
        writingStyle: { mode: 'raw', rawText: 'Write in a bold, energetic voice.' },
      },
    });

    const combined = userContent.map((part) => (part.type === 'text' ? part.text : '')).join('\n');
    expect(combined).toContain('Write in a bold, energetic voice.');
  });

  it('instructs extrapolation when no writing style is supplied', () => {
    const { userContent } = buildGenerateCoverLetterPrompt({
      careerProfile: buildValidCareerProfile(),
      jobDescription: buildJobDescription(),
      matching: buildMatching(),
      resume: buildResume(),
      writingStyle: { careerProfile: buildValidCareerProfile() },
    });

    const combined = userContent.map((part) => (part.type === 'text' ? part.text : '')).join('\n');
    expect(combined).toContain('No explicit writing style was provided');
  });

  it('system prompt enforces a short, non-fabricated, style-matched letter', () => {
    const { systemPrompt } = buildGenerateCoverLetterPrompt({
      careerProfile: buildValidCareerProfile(),
      jobDescription: buildJobDescription(),
      matching: buildMatching(),
      resume: buildResume(),
      writingStyle: {},
    });

    expect(systemPrompt).toMatch(/short/i);
    expect(systemPrompt).toMatch(/never fabricate/i);
    expect(systemPrompt).toMatch(/writing style/i);
  });
});
