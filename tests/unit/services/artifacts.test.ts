import { describe, expect, it } from 'vitest';
import {
  CAREER_PROFILE_ARTIFACT,
  COVER_LETTER_ARTIFACT,
  JOB_DESCRIPTION_ARTIFACT,
  RESUME_ARTIFACT,
  parseArtifactJson,
  serializeArtifact,
} from '../../../src/services/import-export/artifacts';
import { buildValidCareerProfile } from '../schemas/fixtures';

describe('serializeArtifact', () => {
  it('wraps data in the standard export envelope', () => {
    const careerProfile = buildValidCareerProfile();

    const json = serializeArtifact(CAREER_PROFILE_ARTIFACT, careerProfile);
    const parsed = JSON.parse(json);

    expect(parsed.schema_version).toBe('1.0');
    expect(parsed.type).toBe('career-profile');
    expect(parsed.data).toEqual(careerProfile);
  });
});

describe('parseArtifactJson', () => {
  it('imports a valid Career Profile envelope', () => {
    const careerProfile = buildValidCareerProfile();
    const json = serializeArtifact(CAREER_PROFILE_ARTIFACT, careerProfile);

    const result = parseArtifactJson(json, CAREER_PROFILE_ARTIFACT);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(careerProfile);
    }
  });

  it('imports a valid Job Description envelope', () => {
    const jobDescription = JOB_DESCRIPTION_ARTIFACT.dataSchema.parse({
      metadata: { title: 'Senior Engineer' },
    });
    const json = serializeArtifact(JOB_DESCRIPTION_ARTIFACT, jobDescription);

    const result = parseArtifactJson(json, JOB_DESCRIPTION_ARTIFACT);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.metadata.title).toBe('Senior Engineer');
    }
  });

  it('imports a valid Resume envelope', () => {
    const resume = RESUME_ARTIFACT.dataSchema.parse({ contact: { fullName: 'Jamie Rivera' } });
    const json = serializeArtifact(RESUME_ARTIFACT, resume);

    const result = parseArtifactJson(json, RESUME_ARTIFACT);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.contact.fullName).toBe('Jamie Rivera');
    }
  });

  it('imports a valid Cover Letter envelope', () => {
    const coverLetter = COVER_LETTER_ARTIFACT.dataSchema.parse({
      salutation: 'Dear Hiring Manager,',
      bodyParagraphs: ['I am excited to apply.'],
      closing: 'Sincerely, Jamie Rivera',
      senderContact: { fullName: 'Jamie Rivera' },
    });
    const json = serializeArtifact(COVER_LETTER_ARTIFACT, coverLetter);

    const result = parseArtifactJson(json, COVER_LETTER_ARTIFACT);

    expect(result.success).toBe(true);
  });

  it('rejects invalid JSON syntax', () => {
    const result = parseArtifactJson('{ not valid json', CAREER_PROFILE_ARTIFACT);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.kind).toBe('invalid-json');
    }
  });

  it('rejects an envelope with the wrong artifact type', () => {
    const jobDescriptionJson = serializeArtifact(
      JOB_DESCRIPTION_ARTIFACT,
      JOB_DESCRIPTION_ARTIFACT.dataSchema.parse({ metadata: { title: 'Engineer' } }),
    );

    const result = parseArtifactJson(jobDescriptionJson, CAREER_PROFILE_ARTIFACT);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.kind).toBe('wrong-type');
    }
  });

  it('rejects an envelope with an unsupported schema version', () => {
    const envelope = JSON.stringify({
      schema_version: '99.0',
      type: 'career-profile',
      data: buildValidCareerProfile(),
    });

    const result = parseArtifactJson(envelope, CAREER_PROFILE_ARTIFACT);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.kind).toBe('unsupported-version');
    }
  });

  it('rejects an envelope whose data fails schema validation', () => {
    const envelope = JSON.stringify({
      schema_version: '1.0',
      type: 'career-profile',
      data: { personal: {} },
    });

    const result = parseArtifactJson(envelope, CAREER_PROFILE_ARTIFACT);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.kind).toBe('invalid-data');
      expect(result.error.issues?.length).toBeGreaterThan(0);
    }
  });
});
