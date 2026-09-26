import { describe, expect, it } from 'vitest';
import { ResumeTemplateSchema } from '../../../src/schemas/resumeTemplate';

describe('ResumeTemplateSchema', () => {
  it('accepts a fully specified template', () => {
    const result = ResumeTemplateSchema.safeParse({
      id: 'default',
      name: 'Default Template',
      fontFamily: 'Helvetica',
      baseFontSizePt: 10,
      headingFontSizePt: 13,
      marginsPt: { top: 36, right: 36, bottom: 36, left: 36 },
      sectionSpacingPt: 10,
      lineHeight: 1.2,
    });

    expect(result.success).toBe(true);
  });

  it('applies sensible defaults when only id/name are supplied', () => {
    const result = ResumeTemplateSchema.safeParse({ id: 'default', name: 'Default Template' });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.fontFamily).toBe('Helvetica');
      expect(result.data.marginsPt).toEqual({ top: 36, right: 36, bottom: 36, left: 36 });
    }
  });

  it('rejects an unreasonably small base font size', () => {
    const result = ResumeTemplateSchema.safeParse({
      id: 'default',
      name: 'Default Template',
      baseFontSizePt: 1,
    });

    expect(result.success).toBe(false);
  });
});
