import { describe, expect, it } from 'vitest';
import {
  computeHighestEducationLevel,
  computeYearsOfExperience,
  summarizeCareerProfileForStyleExtrapolation,
} from '../../../../src/services/writing-style/extrapolateWritingStyle';
import { buildValidCareerProfile } from '../../schemas/fixtures';

describe('computeYearsOfExperience', () => {
  it('sums the duration of a single ongoing role through the reference date', () => {
    const years = computeYearsOfExperience(
      [
        {
          id: 'exp-1',
          company: 'Initech',
          role: 'Engineer',
          startDate: { month: 1, year: 2020 },
          isCurrent: true,
          projects: [],
          technologies: [],
        },
      ],
      new Date(2026, 0, 1), // Jan 2026
    );

    expect(years).toBe(6);
  });

  it('sums the duration of a completed role using its end date', () => {
    const years = computeYearsOfExperience([
      {
        id: 'exp-1',
        company: 'Initech',
        role: 'Engineer',
        startDate: { month: 1, year: 2018 },
        endDate: { month: 1, year: 2021 },
        isCurrent: false,
        projects: [],
        technologies: [],
      },
    ]);

    expect(years).toBe(3);
  });

  it('sums durations across multiple roles', () => {
    const years = computeYearsOfExperience(
      [
        {
          id: 'exp-1',
          company: 'Initech',
          role: 'Engineer',
          startDate: { month: 1, year: 2015 },
          endDate: { month: 1, year: 2018 },
          isCurrent: false,
          projects: [],
          technologies: [],
        },
        {
          id: 'exp-2',
          company: 'Globex',
          role: 'Senior Engineer',
          startDate: { month: 1, year: 2018 },
          isCurrent: true,
          projects: [],
          technologies: [],
        },
      ],
      new Date(2024, 0, 1),
    );

    expect(years).toBe(9);
  });

  it('returns 0 for no experience', () => {
    expect(computeYearsOfExperience([])).toBe(0);
  });
});

describe('computeHighestEducationLevel', () => {
  it('returns the highest ranked degree among multiple entries', () => {
    const level = computeHighestEducationLevel([
      { id: 'edu-1', institution: 'State University', degree: 'B.S. Computer Science' },
      { id: 'edu-2', institution: 'Tech Institute', degree: 'Master of Science' },
    ]);

    expect(level).toBe("Master's degree");
  });

  it('falls back to the raw degree text when no keyword matches', () => {
    const level = computeHighestEducationLevel([
      { id: 'edu-1', institution: 'Trade School', degree: 'Certificate in Welding' },
    ]);

    expect(level).toBe('Certificate in Welding');
  });

  it('returns undefined when there is no education on file', () => {
    expect(computeHighestEducationLevel([])).toBeUndefined();
  });
});

describe('summarizeCareerProfileForStyleExtrapolation', () => {
  it('summarizes years of experience, education, and self-reference details', () => {
    const profile = buildValidCareerProfile();
    profile.professionalSummarySource = 'I like clear, no-nonsense writing.';

    const summary = summarizeCareerProfileForStyleExtrapolation(profile);

    expect(summary.yearsOfExperience).toBeGreaterThanOrEqual(0);
    expect(summary.highestEducationLevel).toBeDefined();
    expect(summary.selfReferenceDetails).toBe('I like clear, no-nonsense writing.');
  });

  it('returns zero experience and no signals when there is no Career Profile', () => {
    const summary = summarizeCareerProfileForStyleExtrapolation(undefined);

    expect(summary).toEqual({ yearsOfExperience: 0 });
  });
});
