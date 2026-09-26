import { useRef, useState, type ChangeEvent } from 'react';
import {
  CAREER_PROFILE_ARTIFACT,
  COVER_LETTER_ARTIFACT,
  JOB_DESCRIPTION_ARTIFACT,
  RESUME_ARTIFACT,
  downloadArtifact,
  parseArtifactJson,
  type ArtifactDefinition,
} from '../../services/import-export/artifacts';
import { formatZodIssues } from '../../utils/errors';
import { readFileAsText, validateJsonFile } from '../../utils/files';

/**
 * Temporary developer view covering Stage 1 (Schema Foundation) and
 * Stage 3 (File Input and Artifact Import/Export).
 *
 * Lets a developer paste raw JSON for a chosen artifact type, validate
 * it, download it as the standard export envelope, and import a
 * previously exported envelope file back in. This is not part of the
 * real per-artifact editing UI (Stages 5, 6, 9, 10) and can be removed
 * once those stages provide dedicated editors.
 */

const ARTIFACT_OPTIONS: { id: string; label: string; definition: ArtifactDefinition<unknown> }[] = [
  { id: 'career-profile', label: 'Career Profile', definition: CAREER_PROFILE_ARTIFACT },
  { id: 'job-description', label: 'Job Description', definition: JOB_DESCRIPTION_ARTIFACT },
  { id: 'resume', label: 'Resume', definition: RESUME_ARTIFACT },
  { id: 'cover-letter', label: 'Cover Letter', definition: COVER_LETTER_ARTIFACT },
];

type ValidationResult =
  | { status: 'idle' }
  | { status: 'valid'; message: string }
  | { status: 'invalid-json'; message: string }
  | { status: 'invalid-schema'; message: string; issues: string[] };

export function SchemaPlayground() {
  const [artifactId, setArtifactId] = useState(ARTIFACT_OPTIONS[0].id);
  const [jsonText, setJsonText] = useState('');
  const [result, setResult] = useState<ValidationResult>({ status: 'idle' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedOption = ARTIFACT_OPTIONS.find((option) => option.id === artifactId)!;

  function validateCurrentInput(): unknown | undefined {
    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(jsonText);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Invalid JSON.';
      setResult({ status: 'invalid-json', message: `The input is not valid JSON: ${message}` });
      return undefined;
    }

    const parsed = selectedOption.definition.dataSchema.safeParse(parsedJson);
    if (!parsed.success) {
      setResult({
        status: 'invalid-schema',
        message: `The JSON does not match the ${artifactId} schema:`,
        issues: formatZodIssues(parsed.error),
      });
      return undefined;
    }

    return parsed.data;
  }

  function handleValidate() {
    const data = validateCurrentInput();
    if (data !== undefined) {
      setResult({ status: 'valid', message: `Valid: the JSON matches the ${artifactId} schema.` });
    }
  }

  function handleDownload() {
    const data = validateCurrentInput();
    if (data !== undefined) {
      downloadArtifact(selectedOption.definition, data);
      setResult({
        status: 'valid',
        message: `Downloaded ${selectedOption.definition.filename}.`,
      });
    }
  }

  async function handleImportFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    // Allow re-selecting the same file later.
    event.target.value = '';
    if (!file) {
      return;
    }

    const fileValidation = validateJsonFile(file);
    if (!fileValidation.valid) {
      setResult({ status: 'invalid-json', message: fileValidation.error! });
      return;
    }

    const text = await readFileAsText(file);
    const imported = parseArtifactJson(text, selectedOption.definition);

    if (!imported.success) {
      if (imported.error.kind === 'invalid-data') {
        setResult({
          status: 'invalid-schema',
          message: imported.error.message,
          issues: imported.error.issues ?? [],
        });
      } else {
        setResult({ status: 'invalid-json', message: imported.error.message });
      }
      return;
    }

    setJsonText(JSON.stringify(imported.data, null, 2));
    setResult({
      status: 'valid',
      message: `Imported ${selectedOption.definition.filename} successfully.`,
    });
  }

  return (
    <section className="schema-playground" aria-labelledby="schema-playground-heading">
      <h2 id="schema-playground-heading">Developer tool: Schema &amp; import/export playground</h2>
      <p>
        Temporary developer view. Paste raw JSON for the selected artifact type,
        validate it, download it, or import a previously exported file.
      </p>

      <div className="schema-playground__field">
        <label htmlFor="schema-playground-artifact">Artifact type</label>
        <select
          id="schema-playground-artifact"
          value={artifactId}
          onChange={(event) => setArtifactId(event.target.value)}
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

      <div className="schema-playground__actions">
        <button type="button" onClick={handleValidate}>
          Validate
        </button>
        <button type="button" onClick={handleDownload}>
          Download JSON
        </button>
        <button type="button" onClick={() => fileInputRef.current?.click()}>
          Import from file&hellip;
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          aria-label="Import artifact file"
          className="schema-playground__file-input"
          onChange={handleImportFile}
        />
      </div>

      <div aria-live="polite" className="schema-playground__result">
        {result.status === 'valid' && (
          <p role="status" className="schema-playground__success">
            {result.message}
          </p>
        )}
        {result.status === 'invalid-json' && (
          <div role="alert" className="schema-playground__error">
            <p>{result.message}</p>
          </div>
        )}
        {result.status === 'invalid-schema' && (
          <div role="alert" className="schema-playground__error">
            <p>{result.message}</p>
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
