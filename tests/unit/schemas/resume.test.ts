import { describe, expect, it } from 'vitest';
import { MAX_BULLETS_PER_ROLE, ResumeSchema, type Resume } from '../../../src/schemas/resume';

function buildValidResume(): Resume {
  return {
    contact: { fullName: 'Jamie Rivera', otherLinks: [] },
    profileSummary: 'Platform engineer specializing in cloud infrastructure.',
    skills: ['Python', 'Terraform', 'AWS'],
    experience: [
      {
        id: 'exp-1',
        company: 'Initech',
        role: 'Senior Platform Engineer',
        startDate: { month: 3, year: 2021 },
        isCurrent: true,
        bullets: [
          { id: 'b1', text: 'Led migration of Terraform stacks to OpenTofu.' },
          { id: 'b2', text: 'Reduced deployment time by 40% using GitHub Actions.' },
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
    constraints: {
      maxBulletsPerRole: MAX_BULLETS_PER_ROLE,
      targetBulletsPerRole: { min: 4, max: 6 },
      maxSentencesPerBullet: 4,
      pageCountPreference: 'no-preference',
    },
  };
}

describe('ResumeSchema', () => {
  it('accepts a valid Resume', () => {
    const result = ResumeSchema.safeParse(buildValidResume());

    expect(result.success).toBe(true);
  });

  it('rejects a Resume missing the required contact full name', () => {
    const invalid = buildValidResume();
    // @ts-expect-error intentionally violating the schema for the test
    delete invalid.contact.fullName;

    const result = ResumeSchema.safeParse(invalid);

    expect(result.success).toBe(false);
  });

  it('rejects a role with more than the maximum allowed bullets', () => {
    const invalid = buildValidResume();
    invalid.experience[0].bullets = Array.from({ length: MAX_BULLETS_PER_ROLE + 1 }, (_, i) => ({
      id: `b${i}`,
      text: `Bullet number ${i}`,
    }));

    const result = ResumeSchema.safeParse(invalid);

    expect(result.success).toBe(false);
  });

  it('accepts an explicit page count preference', () => {
    const withPageCount = buildValidResume();
    withPageCount.constraints.pageCountPreference = 2;

    const result = ResumeSchema.safeParse(withPageCount);

    expect(result.success).toBe(true);
  });

  it('applies default constraints when none are supplied', () => {
    const minimal = {
      contact: { fullName: 'Jamie Rivera' },
    };

    const result = ResumeSchema.safeParse(minimal);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.constraints.pageCountPreference).toBe('no-preference');
      expect(result.data.constraints.maxBulletsPerRole).toBe(MAX_BULLETS_PER_ROLE);
    }
  });
});
