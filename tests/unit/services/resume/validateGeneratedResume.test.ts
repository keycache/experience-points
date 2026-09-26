import { describe, expect, it } from 'vitest';
import {
  ResumeGenerationValidationError,
  assertResumeMeetsGenerationConstraints,
} from '../../../../src/services/resume/validateGeneratedResume';
import { ResumeConstraintsSchema, ResumeSchema } from '../../../../src/schemas/resume';
import type { Experience } from '../../../../src/schemas/careerProfile';

function buildSelectedExperience(overrides: Partial<Experience> = {}): Experience {
  return {
    id: 'exp-1',
    company: 'Initech',
    role: 'Senior Platform Engineer',
    startDate: { month: 3, year: 2021 },
    isCurrent: true,
    projects: [],
    technologies: [],
    ...overrides,
  };
}

function buildResume(overrides: Record<string, unknown> = {}) {
  return ResumeSchema.parse({
    contact: { fullName: 'Jamie Rivera' },
    experience: [
      {
        id: 'res-exp-1',
        company: 'Initech',
        role: 'Senior Platform Engineer',
        startDate: { month: 3, year: 2021 },
        isCurrent: true,
        bullets: [{ id: 'b1', text: 'Led a major infrastructure migration.' }],
      },
    ],
    ...overrides,
  });
}

describe('assertResumeMeetsGenerationConstraints', () => {
  it('does not throw for a resume that meets all constraints', () => {
    const constraints = ResumeConstraintsSchema.parse({});
    expect(() =>
      assertResumeMeetsGenerationConstraints(buildResume(), constraints, [buildSelectedExperience()]),
    ).not.toThrow();
  });

  it('throws when a resume includes an experience not in the selection (fabricated/unselected)', () => {
    const constraints = ResumeConstraintsSchema.parse({});
    const resume = buildResume({
      experience: [
        {
          id: 'res-exp-1',
          company: 'Umbrella Corp',
          role: 'Engineer',
          startDate: { month: 1, year: 2020 },
          isCurrent: true,
          bullets: [{ id: 'b1', text: 'Did something.' }],
        },
      ],
    });

    expect(() =>
      assertResumeMeetsGenerationConstraints(resume, constraints, [buildSelectedExperience()]),
    ).toThrow(ResumeGenerationValidationError);
  });

  it('throws when a bullet exceeds the maximum sentence count', () => {
    const constraints = ResumeConstraintsSchema.parse({ maxSentencesPerBullet: 2 });
    const resume = buildResume({
      experience: [
        {
          id: 'res-exp-1',
          company: 'Initech',
          role: 'Senior Platform Engineer',
          startDate: { month: 3, year: 2021 },
          isCurrent: true,
          bullets: [
            {
              id: 'b1',
              text: 'Led a migration. Reduced costs significantly. Mentored two engineers. Improved reliability.',
            },
          ],
        },
      ],
    });

    expect(() =>
      assertResumeMeetsGenerationConstraints(resume, constraints, [buildSelectedExperience()]),
    ).toThrow(/exceeding the maximum of 2/);
  });

  it('throws when a role exceeds the maximum bullet count for the given constraints', () => {
    const constraints = ResumeConstraintsSchema.parse({ maxBulletsPerRole: 2 });
    const resume = buildResume({
      experience: [
        {
          id: 'res-exp-1',
          company: 'Initech',
          role: 'Senior Platform Engineer',
          startDate: { month: 3, year: 2021 },
          isCurrent: true,
          bullets: [
            { id: 'b1', text: 'One.' },
            { id: 'b2', text: 'Two.' },
            { id: 'b3', text: 'Three.' },
          ],
        },
      ],
    });

    expect(() =>
      assertResumeMeetsGenerationConstraints(resume, constraints, [buildSelectedExperience()]),
    ).toThrow(/exceeding the maximum of 2/);
  });

  it('accumulates multiple violations into a single error', () => {
    const constraints = ResumeConstraintsSchema.parse({ maxSentencesPerBullet: 1 });
    const resume = buildResume({
      experience: [
        {
          id: 'res-exp-1',
          company: 'Fabricated Co',
          role: 'Engineer',
          startDate: { month: 1, year: 2020 },
          isCurrent: true,
          bullets: [{ id: 'b1', text: 'Did one thing. And another thing.' }],
        },
      ],
    });

    try {
      assertResumeMeetsGenerationConstraints(resume, constraints, [buildSelectedExperience()]);
      expect.fail('Expected assertResumeMeetsGenerationConstraints to throw');
    } catch (error) {
      expect(error).toBeInstanceOf(ResumeGenerationValidationError);
      expect((error as Error).message).toMatch(/not part of the selected/);
      expect((error as Error).message).toMatch(/exceeding the maximum of 1/);
    }
  });
});
