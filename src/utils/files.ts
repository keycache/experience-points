/**
 * File reading and validation utilities.
 *
 * See specification.md section 3.5 (Browser APIs) and plan.md Stage 3
 * (File Input and Artifact Import/Export). Uploaded raw images are only
 * read into memory here; the application does not retain them beyond
 * their associated extraction stage (later stages) unless the current
 * UI state explicitly requires it.
 */

export const MAX_JSON_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
export const MAX_IMAGE_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export const ACCEPTED_IMAGE_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
] as const;

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) {
    return `${Math.ceil(bytes / 1024)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Validates a file the user selected as a JSON artifact import.
 *
 * Browsers do not always populate `file.type` for `.json` files
 * (it is sometimes reported as an empty string), so the file extension
 * is accepted as a fallback signal.
 */
export function validateJsonFile(file: File): FileValidationResult {
  if (file.size > MAX_JSON_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `File is too large (${formatBytes(file.size)}). Maximum size is ${formatBytes(MAX_JSON_FILE_SIZE_BYTES)}.`,
    };
  }

  const looksLikeJson =
    file.type === 'application/json' ||
    file.type === '' ||
    file.name.toLowerCase().endsWith('.json');

  if (!looksLikeJson) {
    return {
      valid: false,
      error: `Unsupported file type "${file.type || 'unknown'}". Please select a .json file.`,
    };
  }

  return { valid: true };
}

/**
 * Validates a file the user selected as an image (e.g. a screenshot of
 * a job description or resume) prior to reading it.
 */
export function validateImageFile(file: File): FileValidationResult {
  if (file.size > MAX_IMAGE_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `Image is too large (${formatBytes(file.size)}). Maximum size is ${formatBytes(MAX_IMAGE_FILE_SIZE_BYTES)}.`,
    };
  }

  if (!ACCEPTED_IMAGE_MIME_TYPES.includes(file.type as (typeof ACCEPTED_IMAGE_MIME_TYPES)[number])) {
    return {
      valid: false,
      error: `Unsupported image type "${file.type || 'unknown'}". Accepted types: PNG, JPEG, WEBP, GIF.`,
    };
  }

  return { valid: true };
}

/** Reads a text-like file (e.g. an imported JSON artifact) as a string. */
export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read file.'));
    reader.readAsText(file);
  });
}

/** Reads an image file as a `data:` URL suitable for LLM image input. */
export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read file.'));
    reader.readAsDataURL(file);
  });
}
