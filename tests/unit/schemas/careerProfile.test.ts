import { describe, expect, it } from 'vitest';
import { CareerProfileSchema } from '../../../src/schemas/careerProfile';
import { buildValidCareerProfile } from './fixtures';

describe('CareerProfileSchema', () => {
  it('accepts a valid Career Profile', () => {
    const result = CareerProfileSchema.safeParse(buildValidCareerProfile());

    expect(result.success).toBe(true);
  });

  it('rejects a Career Profile missing a required field (personal.fullName)', () => {
    const invalid = buildValidCareerProfile();
    // @ts-expect-error intentionally violating the schema for the test
    delete invalid.personal.fullName;

    const result = CareerProfileSchema.safeParse(invalid);

    expect(result.success).toBe(false);
  });

  it('rejects an experience entry with an invalid month/year date', () => {
    const invalid = buildValidCareerProfile();
    invalid.experience[0].startDate = { month: 13, year: 2021 };

    const result = CareerProfileSchema.safeParse(invalid);

    expect(result.success).toBe(false);
  });

  it('defaults array sections that were not supplied', () => {
    const minimal = {
      personal: { fullName: 'Jamie Rivera', otherLinks: [] },
    };

    const result = CareerProfileSchema.safeParse(minimal);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.experience).toEqual([]);
      expect(result.data.skills).toEqual([]);
      expect(result.data.customSections).toEqual([]);
    }
  });
});
