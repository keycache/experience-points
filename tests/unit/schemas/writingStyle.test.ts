import { describe, expect, it } from 'vitest';
import { WritingStyleSchema } from '../../../src/schemas/writingStyle';

describe('WritingStyleSchema', () => {
  it('accepts structured style fields', () => {
    const result = WritingStyleSchema.safeParse({
      mode: 'structured',
      tone: 'confident, concise',
      voice: 'first-person',
      formality: 'formal',
    });

    expect(result.success).toBe(true);
  });

  it('accepts raw style text', () => {
    const result = WritingStyleSchema.safeParse({
      mode: 'raw',
      rawText: 'Write in a warm, direct, first-person voice.',
    });

    expect(result.success).toBe(true);
  });

  it('defaults to unspecified when no style is supplied', () => {
    const result = WritingStyleSchema.safeParse({});

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.mode).toBe('unspecified');
    }
  });

  it('rejects an unsupported mode value', () => {
    const result = WritingStyleSchema.safeParse({ mode: 'freeform' });

    expect(result.success).toBe(false);
  });
});
