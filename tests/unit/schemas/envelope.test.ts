import { describe, expect, it } from 'vitest';
import { CareerProfileEnvelopeSchema } from '../../../src/schemas/careerProfile';
import { JobDescriptionEnvelopeSchema } from '../../../src/schemas/jobDescription';
import { buildValidCareerProfile } from './fixtures';

describe('export envelope', () => {
  it('accepts a correctly formed export envelope', () => {
    const envelope = {
      schema_version: '1.0',
      type: 'career-profile',
      data: buildValidCareerProfile(),
    };

    const result = CareerProfileEnvelopeSchema.safeParse(envelope);

    expect(result.success).toBe(true);
  });

  it('rejects an envelope with the wrong artifact type', () => {
    const envelope = {
      schema_version: '1.0',
      type: 'job-description',
      data: buildValidCareerProfile(),
    };

    const result = CareerProfileEnvelopeSchema.safeParse(envelope);

    expect(result.success).toBe(false);
  });

  it('rejects an envelope with an unsupported schema version', () => {
    const envelope = {
      schema_version: '99.0',
      type: 'career-profile',
      data: buildValidCareerProfile(),
    };

    const result = CareerProfileEnvelopeSchema.safeParse(envelope);

    expect(result.success).toBe(false);
  });

  it('rejects a career-profile envelope whose data does not validate', () => {
    const envelope = {
      schema_version: '1.0',
      type: 'career-profile',
      data: { personal: {} },
    };

    const result = CareerProfileEnvelopeSchema.safeParse(envelope);

    expect(result.success).toBe(false);
  });

  it('validates each artifact type against its own envelope schema', () => {
    const jdEnvelope = {
      schema_version: '1.0',
      type: 'job-description',
      data: { metadata: { title: 'Engineer' } },
    };

    expect(JobDescriptionEnvelopeSchema.safeParse(jdEnvelope).success).toBe(true);
    expect(CareerProfileEnvelopeSchema.safeParse(jdEnvelope).success).toBe(false);
  });
});
