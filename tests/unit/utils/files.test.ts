import { describe, expect, it } from 'vitest';
import {
  ACCEPTED_IMAGE_MIME_TYPES,
  MAX_IMAGE_FILE_SIZE_BYTES,
  MAX_JSON_FILE_SIZE_BYTES,
  readFileAsDataUrl,
  readFileAsText,
  validateImageFile,
  validateJsonFile,
} from '../../../src/utils/files';

function makeFile(contents: string, name: string, type: string): File {
  return new File([contents], name, { type });
}

describe('validateJsonFile', () => {
  it('accepts a well-formed .json file', () => {
    const file = makeFile('{}', 'career-profile.json', 'application/json');

    expect(validateJsonFile(file).valid).toBe(true);
  });

  it('accepts a .json file even when the browser omits the MIME type', () => {
    const file = makeFile('{}', 'career-profile.json', '');

    expect(validateJsonFile(file).valid).toBe(true);
  });

  it('rejects a file with an unsupported type/extension', () => {
    const file = makeFile('not json', 'notes.txt', 'text/plain');

    const result = validateJsonFile(file);
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/\.json/);
  });

  it('rejects a file larger than the maximum size', () => {
    const oversized = new File([new Uint8Array(MAX_JSON_FILE_SIZE_BYTES + 1)], 'big.json', {
      type: 'application/json',
    });

    const result = validateJsonFile(oversized);
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/too large/i);
  });
});

describe('validateImageFile', () => {
  it.each(ACCEPTED_IMAGE_MIME_TYPES)('accepts a %s image', (mimeType) => {
    const file = makeFile('binary-image-data', 'screenshot.png', mimeType);

    expect(validateImageFile(file).valid).toBe(true);
  });

  it('rejects an unsupported image type', () => {
    const file = makeFile('binary-image-data', 'screenshot.bmp', 'image/bmp');

    const result = validateImageFile(file);
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/unsupported image type/i);
  });

  it('rejects an image larger than the maximum size', () => {
    const oversized = new File([new Uint8Array(MAX_IMAGE_FILE_SIZE_BYTES + 1)], 'huge.png', {
      type: 'image/png',
    });

    const result = validateImageFile(oversized);
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/too large/i);
  });
});

describe('readFileAsText', () => {
  it('resolves with the text content of the file', async () => {
    const file = makeFile('{"hello":"world"}', 'data.json', 'application/json');

    const text = await readFileAsText(file);

    expect(text).toBe('{"hello":"world"}');
  });
});

describe('readFileAsDataUrl', () => {
  it('resolves with a data: URL for an image file', async () => {
    const file = makeFile('binary-image-data', 'screenshot.png', 'image/png');

    const dataUrl = await readFileAsDataUrl(file);

    expect(dataUrl.startsWith('data:image/png')).toBe(true);
  });
});
