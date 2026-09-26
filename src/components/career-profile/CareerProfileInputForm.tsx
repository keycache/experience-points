import { useRef, useState, type ChangeEvent } from 'react';
import { readFileAsDataUrl, validateImageFile, validateJsonFile, readFileAsText } from '../../utils/files';
import { generateId } from '../../utils/ids';
import { parseArtifactJson } from '../../services/import-export/artifacts';
import { CAREER_PROFILE_ARTIFACT } from '../../services/import-export/artifacts';
import type { CareerProfile } from '../../schemas/careerProfile';

interface StagedImage {
  id: string;
  name: string;
  dataUrl: string;
  mimeType: string;
}

export interface CareerProfileGenerateInput {
  rawText: string;
  additionalDetails: string;
  images: { dataUrl: string; mimeType: string }[];
}

type GenerationState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; message: string };

interface CareerProfileInputFormProps {
  hasExistingProfile: boolean;
  generationState: GenerationState;
  onGenerate: (input: CareerProfileGenerateInput) => void;
  onImportProfile: (profile: CareerProfile) => void;
}

/**
 * Raw-input form for Career Profile extraction/merge (plan.md Stage 5):
 * raw text, multiple images, free-form additional details, importing an
 * existing Career Profile JSON, and the Generate/Update action.
 */
export function CareerProfileInputForm({
  hasExistingProfile,
  generationState,
  onGenerate,
  onImportProfile,
}: CareerProfileInputFormProps) {
  const [rawText, setRawText] = useState('');
  const [additionalDetails, setAdditionalDetails] = useState('');
  const [images, setImages] = useState<StagedImage[]>([]);
  const [imageError, setImageError] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const importFileInputRef = useRef<HTMLInputElement>(null);

  const hasAnyInput = rawText.trim().length > 0 || additionalDetails.trim().length > 0 || images.length > 0;
  const canGenerate = (hasAnyInput || hasExistingProfile) && generationState.status !== 'loading';

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
    const result = parseArtifactJson(text, CAREER_PROFILE_ARTIFACT);
    if (!result.success) {
      setImportError(result.error.message);
      return;
    }

    setImportError(null);
    onImportProfile(result.data);
  }

  function handleGenerateClick() {
    onGenerate({
      rawText,
      additionalDetails,
      images: images.map(({ dataUrl, mimeType }) => ({ dataUrl, mimeType })),
    });
  }

  return (
    <div className="career-profile-input-form">
      <div className="field-row">
        <label htmlFor="career-profile-raw-text">Raw professional history</label>
        <textarea
          id="career-profile-raw-text"
          rows={8}
          value={rawText}
          onChange={(event) => setRawText(event.target.value)}
          placeholder="Paste your resume, LinkedIn export, or a free-form description of your professional history..."
        />
      </div>

      <div className="field-row">
        <label htmlFor="career-profile-additional-details">Additional details</label>
        <textarea
          id="career-profile-additional-details"
          rows={3}
          value={additionalDetails}
          onChange={(event) => setAdditionalDetails(event.target.value)}
          placeholder="Anything else worth mentioning (years of experience, education level, tone you'd like to convey, etc.)"
        />
      </div>

      <div className="field-row">
        <label htmlFor="career-profile-images">Images (e.g. resume screenshots)</label>
        <input
          id="career-profile-images"
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
          {generationState.status === 'loading'
            ? 'Generating…'
            : hasExistingProfile
              ? 'Update Career Profile'
              : 'Generate Career Profile'}
        </button>

        <button type="button" onClick={() => importFileInputRef.current?.click()}>
          Import existing Career Profile&hellip;
        </button>
        <input
          ref={importFileInputRef}
          type="file"
          accept=".json,application/json"
          aria-label="Import Career Profile file"
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
