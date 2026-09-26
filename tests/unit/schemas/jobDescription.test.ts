import { describe, expect, it } from 'vitest';
import { JobDescriptionSchema, type JobDescription } from '../../../src/schemas/jobDescription';

function buildValidJobDescription(): JobDescription {
  return {
    metadata: {
      title: 'Senior Platform Engineer',
      company: 'Hooli',
      location: 'Remote',
    },
    summary: 'Own our cloud infrastructure and CI/CD platform.',
    responsibilities: ['Design and operate Kubernetes clusters'],
    requirements: ['5+ years with Terraform', 'Strong Python skills'],
    preferredQualifications: ['Experience with GitHub Actions'],
    technologies: ['Python', 'Terraform', 'AWS', 'Kubernetes', 'GitHub Actions'],
    leadershipExpectations: [],
    domainSignals: [],
    otherSignals: [],
  };
}

describe('JobDescriptionSchema', () => {
  it('accepts a valid Job Description', () => {
    const result = JobDescriptionSchema.safeParse(buildValidJobDescription());

    expect(result.success).toBe(true);
  });

  it('rejects a Job Description missing the required title', () => {
    const invalid = buildValidJobDescription();
    // @ts-expect-error intentionally violating the schema for the test
    delete invalid.metadata.title;

    const result = JobDescriptionSchema.safeParse(invalid);

    expect(result.success).toBe(false);
  });

  it('defaults list sections that were not supplied', () => {
    const minimal = { metadata: { title: 'Engineer' } };

    const result = JobDescriptionSchema.safeParse(minimal);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.requirements).toEqual([]);
      expect(result.data.technologies).toEqual([]);
    }
  });
});
