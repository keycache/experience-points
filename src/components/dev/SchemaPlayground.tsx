import { useState } from 'react';
import { z } from 'zod';
import { CareerProfileSchema } from '../../schemas/careerProfile';
import { JobDescriptionSchema } from '../../schemas/jobDescription';
import { ResumeSchema } from '../../schemas/resume';
import { CoverLetterSchema } from '../../schemas/coverLetter';

/**
 * Temporary developer view for Stage 1 (Schema Foundation).
 *
 * Lets a developer paste raw JSON, pick which domain schema to validate
 * it against, and see either a success confirmation or a readable list
 * of validation errors. This is not part of the real import/export UI
 * (see plan.md Stage 3) and can be removed once that stage lands.
 */

const SCHEMAS_BY_ARTIFACT = {
  'career-profile': CareerProfileSchema,
  'job-description': JobDescriptionSchema,
  resume: ResumeSchema,
  'cover-letter': CoverLetterSchema,
} as const;

type ArtifactId = keyof typeof SCHEMAS_BY_ARTIFACT;

const ARTIFACT_OPTIONS: { id: ArtifactId; label: string }[] = [
  { id: 'career-profile', label: 'Career Profile' },
  { id: 'job-description', label: 'Job Description' },
  { id: 'resume', label: 'Resume' },
  { id: 'cover-letter', label: 'Cover Letter' },
];

type ValidationResult =
  | { status: 'idle' }
  | { status: 'valid' }
  | { status: 'invalid-json'; message: string }
  | { status: 'invalid-schema'; issues: string[] };

function formatZodIssues(error: z.ZodError): string[] {
  return error.issues.map((issue) => {
    const path = issue.path.length > 0 ? issue.path.join('.') : '(root)';
    return `${path}: ${issue.message}`;
  });
}

export function SchemaPlayground() {
  const [artifactId, setArtifactId] = useState<ArtifactId>('career-profile');
  const [jsonText, setJsonText] = useState('');
  const [result, setResult] = useState<ValidationResult>({ status: 'idle' });

  function handleValidate() {
    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(jsonText);
    } catch (error) {
      setResult({
        status: 'invalid-json',
        message: error instanceof Error ? error.message : 'Invalid JSON.',
      });
      return;
    }

    const schema = SCHEMAS_BY_ARTIFACT[artifactId];
    const parsed = schema.safeParse(parsedJson);

    if (parsed.success) {
      setResult({ status: 'valid' });
    } else {
      setResult({ status: 'invalid-schema', issues: formatZodIssues(parsed.error) });
    }
  }

  return (
    <section className="schema-playground" aria-labelledby="schema-playground-heading">
      <h2 id="schema-playground-heading">Developer tool: Schema validation playground</h2>
      <p>
        Temporary developer view. Paste raw JSON for the selected artifact type
        and validate it against the application&rsquo;s schemas.
      </p>

      <div className="schema-playground__field">
        <label htmlFor="schema-playground-artifact">Artifact type</label>
        <select
          id="schema-playground-artifact"
          value={artifactId}
          onChange={(event) => setArtifactId(event.target.value as ArtifactId)}
        >
          {ARTIFACT_OPTIONS.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="schema-playground__field">
        <label htmlFor="schema-playground-json">JSON input</label>
        <textarea
          id="schema-playground-json"
          rows={10}
          value={jsonText}
          onChange={(event) => setJsonText(event.target.value)}
          placeholder='{ "personal": { "fullName": "Jamie Rivera" } }'
        />
      </div>

      <button type="button" onClick={handleValidate}>
        Validate
      </button>

      <div aria-live="polite" className="schema-playground__result">
        {result.status === 'valid' && (
          <p role="status" className="schema-playground__success">
            Valid: the JSON matches the {artifactId} schema.
          </p>
        )}
        {result.status === 'invalid-json' && (
          <div role="alert" className="schema-playground__error">
            <p>The input is not valid JSON:</p>
            <p>{result.message}</p>
          </div>
        )}
        {result.status === 'invalid-schema' && (
          <div role="alert" className="schema-playground__error">
            <p>The JSON does not match the {artifactId} schema:</p>
            <ul>
              {result.issues.map((issue) => (
                <li key={issue}>{issue}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
