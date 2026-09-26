import { z } from 'zod';
import { CURRENT_SCHEMA_VERSION } from '../../schemas/common';
import { CareerProfileSchema, type CareerProfile } from '../../schemas/careerProfile';
import { JobDescriptionSchema, type JobDescription } from '../../schemas/jobDescription';
import { ResumeSchema, type Resume } from '../../schemas/resume';
import { CoverLetterSchema, type CoverLetter } from '../../schemas/coverLetter';
import { formatZodIssues } from '../../utils/errors';
import { downloadTextFile } from '../../utils/downloads';

/**
 * Artifact import/export service.
 *
 * See specification.md section 13 (Import/Export). This module is the
 * single place that knows how to wrap/unwrap the export envelope
 * (`schema_version` / `type` / `data`), so the rest of the application
 * only ever deals in plain domain objects (CareerProfile, JobDescription,
 * Resume, CoverLetter).
 */

export interface ArtifactDefinition<T> {
  type: string;
  filename: string;
  dataSchema: z.ZodType<T>;
}

export const CAREER_PROFILE_ARTIFACT: ArtifactDefinition<CareerProfile> = {
  type: 'career-profile',
  filename: 'career-profile.json',
  dataSchema: CareerProfileSchema,
};

export const JOB_DESCRIPTION_ARTIFACT: ArtifactDefinition<JobDescription> = {
  type: 'job-description',
  filename: 'job-description.json',
  dataSchema: JobDescriptionSchema,
};

export const RESUME_ARTIFACT: ArtifactDefinition<Resume> = {
  type: 'resume',
  filename: 'resume.json',
  dataSchema: ResumeSchema,
};

export const COVER_LETTER_ARTIFACT: ArtifactDefinition<CoverLetter> = {
  type: 'cover-letter',
  filename: 'cover-letter.json',
  dataSchema: CoverLetterSchema,
};

export type ImportErrorKind =
  | 'invalid-json'
  | 'wrong-type'
  | 'unsupported-version'
  | 'invalid-data';

export interface ArtifactImportError {
  kind: ImportErrorKind;
  message: string;
  issues?: string[];
}

export type ArtifactImportResult<T> =
  | { success: true; data: T }
  | { success: false; error: ArtifactImportError };

/** Serializes a domain object into the standard export envelope JSON. */
export function serializeArtifact<T>(definition: ArtifactDefinition<T>, data: T): string {
  const envelope = {
    schema_version: CURRENT_SCHEMA_VERSION,
    type: definition.type,
    data,
  };
  return JSON.stringify(envelope, null, 2);
}

/** Triggers a browser download of the artifact's standard JSON envelope. */
export function downloadArtifact<T>(definition: ArtifactDefinition<T>, data: T): void {
  downloadTextFile(definition.filename, serializeArtifact(definition, data));
}

/**
 * Parses and validates raw JSON text as the given artifact type.
 *
 * Validation proceeds in stages so the resulting error is specific and
 * actionable: invalid JSON syntax, the wrong `type`, an unsupported
 * `schema_version`, or data that fails the artifact's Zod schema.
 */
export function parseArtifactJson<T>(
  jsonText: string,
  definition: ArtifactDefinition<T>,
): ArtifactImportResult<T> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch (error) {
    return {
      success: false,
      error: {
        kind: 'invalid-json',
        message: error instanceof Error ? error.message : 'The file is not valid JSON.',
      },
    };
  }

  if (typeof parsed !== 'object' || parsed === null) {
    return {
      success: false,
      error: {
        kind: 'invalid-json',
        message: 'Expected a JSON object with schema_version, type, and data fields.',
      },
    };
  }

  const envelope = parsed as Record<string, unknown>;

  if (envelope.type !== definition.type) {
    return {
      success: false,
      error: {
        kind: 'wrong-type',
        message: `Expected artifact type "${definition.type}" but the file declares "${String(envelope.type)}".`,
      },
    };
  }

  if (envelope.schema_version !== CURRENT_SCHEMA_VERSION) {
    return {
      success: false,
      error: {
        kind: 'unsupported-version',
        message: `Unsupported schema version "${String(envelope.schema_version)}". This application supports version "${CURRENT_SCHEMA_VERSION}".`,
      },
    };
  }

  const dataResult = definition.dataSchema.safeParse(envelope.data);
  if (!dataResult.success) {
    return {
      success: false,
      error: {
        kind: 'invalid-data',
        message: `The ${definition.type} data does not match the expected schema.`,
        issues: formatZodIssues(dataResult.error),
      },
    };
  }

  return { success: true, data: dataResult.data };
}
