import { describe, expect, it, vi } from 'vitest';
import { generateCoverLetterPdfBlob } from '../../../../src/services/pdf/generateCoverLetterPdf';
import { CoverLetterSchema, type CoverLetter } from '../../../../src/schemas/coverLetter';

function buildCoverLetter(overrides: Record<string, unknown> = {}): CoverLetter {
  return CoverLetterSchema.parse({
    salutation: 'Dear Hiring Manager,',
    bodyParagraphs: [
      'I am excited to apply for the Senior Platform Engineer role at Hooli.',
      'At Initech, I led the migration of Terraform stacks to OpenTofu.',
    ],
    closing: 'Sincerely,',
    senderContact: {
      fullName: 'Jamie Rivera',
      email: 'jamie.rivera@example.com',
      phone: '555-123-4567',
      website: 'https://jamierivera.dev',
      github: 'https://github.com/jamierivera',
      linkedin: 'https://linkedin.com/in/jamierivera',
      otherLinks: [],
    },
    ...overrides,
  });
}

async function blobToLatin1Text(blob: Blob): Promise<string> {
  const buffer = await blob.arrayBuffer();
  return Buffer.from(buffer).toString('latin1');
}

describe('generateCoverLetterPdfBlob', () => {
  it('returns a valid PDF Blob', async () => {
    const blob = await generateCoverLetterPdfBlob(buildCoverLetter());

    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe('application/pdf');
    expect(blob.size).toBeGreaterThan(0);

    const text = await blobToLatin1Text(blob);
    expect(text.startsWith('%PDF')).toBe(true);
  });

  it('does not make any network request while generating a PDF', async () => {
    // As with the Resume PDF renderer (plan.md Stage 12), the WASM-based
    // text shaping engine resolves its module via fetch() against an
    // inline `data:` URI -- never a real network request.
    const originalFetch = globalThis.fetch;
    const requestedUrls: string[] = [];
    const fetchSpy = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input.toString();
      requestedUrls.push(url);
      if (!url.startsWith('data:')) {
        throw new Error(`generateCoverLetterPdfBlob must not perform network requests (got: ${url})`);
      }
      return originalFetch(input, init);
    });
    vi.stubGlobal('fetch', fetchSpy);

    try {
      await generateCoverLetterPdfBlob(buildCoverLetter());
      expect(requestedUrls.every((url) => url.startsWith('data:'))).toBe(true);
    } finally {
      vi.stubGlobal('fetch', originalFetch);
    }
  });

  it('represents sender contact links as clickable PDF link annotations', async () => {
    const blob = await generateCoverLetterPdfBlob(buildCoverLetter());
    const text = await blobToLatin1Text(blob);

    expect(text).toContain('mailto:jamie.rivera@example.com');
    expect(text).toContain('tel:555-123-4567');
    expect(text).toContain('https://jamierivera.dev');
    expect(text).toContain('https://github.com/jamierivera');
    expect(text).toContain('https://linkedin.com/in/jamierivera');
  });

  it('produces a single-page document', async () => {
    const blob = await generateCoverLetterPdfBlob(buildCoverLetter());
    const text = await blobToLatin1Text(blob);

    expect((text.match(/\/Count (\d+)/) ?? [])[1]).toBe('1');
  });

  it('produces a meaningfully smaller PDF when the recipient/sender-links are absent', async () => {
    const richBlob = await generateCoverLetterPdfBlob(
      buildCoverLetter({ recipient: { hiringManagerName: 'Taylor Swift', company: 'Hooli' } }),
    );
    const minimalBlob = await generateCoverLetterPdfBlob(
      buildCoverLetter({
        recipient: undefined,
        senderContact: { fullName: 'Jamie Rivera', otherLinks: [] },
      }),
    );

    expect(minimalBlob.size).toBeLessThan(richBlob.size);
  });
});
