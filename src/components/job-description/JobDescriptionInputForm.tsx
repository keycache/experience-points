import { useRef, useState, type ChangeEvent } from 'react';
import { readFileAsDataUrl, validateImageFile, validateJsonFile, readFileAsText } from '../../utils/files';
import { generateId } from '../../utils/ids';
import { parseArtifactJson, JOB_DESCRIPTION_ARTIFACT } from '../../services/import-export/artifacts';
import type { JobDescription } from '../../schemas/jobDescription';

interface StagedImage {
  id: string;
  name: string;
  dataUrl: string;
  mimeType: string;
}

export interface JobDescriptionGenerateInput {
  rawText: string;
  images: { dataUrl: string; mimeType: string }[];
}

type GenerationState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; message: string };

interface JobDescriptionInputFormProps {
  generationState: GenerationState;
  onGenerate: (input: JobDescriptionGenerateInput) => void;
  onImportJobDescription: (jobDescription: JobDescription) => void;
}

/**
 * Raw-input form for Job Description extraction (plan.md Stage 6): raw
 * text, multiple images, importing an existing structured JD JSON
 * (which skips extraction entirely), and the Generate action.
 */
export function JobDescriptionInputForm({
  generationState,
  onGenerate,
  onImportJobDescription,
}: JobDescriptionInputFormProps) {
  const [rawText, setRawText] = useState('');
  const [images, setImages] = useState<StagedImage[]>([]);
  const [imageError, setImageError] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const importFileInputRef = useRef<HTMLInputElement>(null);

  const hasAnyInput = rawText.trim().length > 0 || images.length > 0;
  const canGenerate = hasAnyInput && generationState.status !== 'loading';

  async function handleImagesSelected(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = '';
    if (files.length === 0) {
      return;
    }

    const nextImages: StagedImage[] = [];
    for (const file of files) {
      const validation = validateImageFile(file);
      if (!validation.valid) {
        setImageError(validation.error ?? 'Invalid image.');
        return;
      }
      const dataUrl = await readFileAsDataUrl(file);
      nextImages.push({ id: generateId(), name: file.name, dataUrl, mimeType: file.type });
    }

    setImageError(null);
    setImages((current) => [...current, ...nextImages]);
  }

  function removeImage(id: string) {
    setImages((current) => current.filter((image) => image.id !== id));
  }

  async function handleImportFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) {
      return;
    }

    const fileValidation = validateJsonFile(file);
    if (!fileValidation.valid) {
      setImportError(fileValidation.error ?? 'Invalid file.');
      return;
    }

    const text = await readFileAsText(file);
    const result = parseArtifactJson(text, JOB_DESCRIPTION_ARTIFACT);
    if (!result.success) {
      setImportError(result.error.message);
      return;
    }

    setImportError(null);
    // Importing a valid structured JD skips extraction entirely
    // (specification.md section 13 / plan.md Stage 6).
    onImportJobDescription(result.data);
  }

  function handleGenerateClick() {
    onGenerate({ rawText, images: images.map(({ dataUrl, mimeType }) => ({ dataUrl, mimeType })) });
  }

  return (
    <div className="job-description-input-form">
      <div className="field-row">
        <label htmlFor="job-description-raw-text">Raw job description</label>
        <textarea
          id="job-description-raw-text"
          rows={8}
          value={rawText}
          onChange={(event) => setRawText(event.target.value)}
          placeholder="Paste the job description text..."
        />
      </div>

      <div className="field-row">
        <label htmlFor="job-description-images">Images (e.g. JD screenshots)</label>
        <input
          id="job-description-images"
          type="file"
          accept="image/*"
          multiple
          onChange={handleImagesSelected}
        />
        {imageError && (
          <p role="alert" className="career-profile-input-form__error">
            {imageError}
          </p>
        )}
        {images.length > 0 && (
          <ul className="career-profile-input-form__image-list">
            {images.map((image) => (
              <li key={image.id}>
                {image.name}
                <button type="button" onClick={() => removeImage(image.id)}>
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="career-profile-input-form__actions">
        <button type="button" onClick={handleGenerateClick} disabled={!canGenerate}>
          {generationState.status === 'loading' ? 'Generating…' : 'Generate Structured JD'}
        </button>

        <button type="button" onClick={() => importFileInputRef.current?.click()}>
          Import structured JD&hellip;
        </button>
        <input
          ref={importFileInputRef}
          type="file"
          accept=".json,application/json"
          aria-label="Import Job Description file"
          className="visually-hidden-input"
          onChange={handleImportFile}
        />
      </div>

      {importError && (
        <p role="alert" className="career-profile-input-form__error">
          {importError}
        </p>
      )}

      {generationState.status === 'error' && (
        <div role="alert" className="career-profile-input-form__error">
          <p>{generationState.message}</p>
          <button type="button" onClick={handleGenerateClick}>
            Retry
          </button>
        </div>
      )}
    </div>
  );
}
