import { describe, expect, it, vi } from 'vitest';
import { generateResumePdfBlob } from '../../../../src/services/pdf/generateResumePdf';
import { ResumeSchema, type Resume } from '../../../../src/schemas/resume';
import { paginateResume } from '../../../../src/services/resume-preview/paginateResume';

function buildResume(overrides: Record<string, unknown> = {}): Resume {
  return ResumeSchema.parse({
    contact: { fullName: 'Jamie Rivera' },
    ...overrides,
  });
}

function buildRole(id: string, bulletCount: number) {
  return {
    id,
    company: `Company ${id}`,
    role: 'Engineer',
    startDate: { month: 1, year: 2015 },
    endDate: { month: 1, year: 2018 },
    isCurrent: false,
    bullets: Array.from({ length: bulletCount }, (_, i) => ({
      id: `${id}-b${i}`,
      text: `Accomplishment number ${i} with a reasonably long, realistic description of impactful work delivered for this role.`,
    })),
  };
}

async function blobToLatin1Text(blob: Blob): Promise<string> {
  const buffer = await blob.arrayBuffer();
  return Buffer.from(buffer).toString('latin1');
}

describe('generateResumePdfBlob', () => {
  it('returns a valid PDF Blob', async () => {
    const blob = await generateResumePdfBlob(buildResume({ profileSummary: 'A short summary.' }));

    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe('application/pdf');
    expect(blob.size).toBeGreaterThan(0);

    const text = await blobToLatin1Text(blob);
    expect(text.startsWith('%PDF')).toBe(true);
  });

  it('does not make any network request while generating a PDF', async () => {
    // The PDF renderer's WASM-based text shaping engine resolves its module via
    // fetch() against an inline `data:` URI. That never touches the network (no
    // DNS lookup, no socket) -- it is just how the browser fetch API is reused to
    // decode inline data. Real network requests (http/https) must never occur.
    const originalFetch = globalThis.fetch;
    const requestedUrls: string[] = [];
    const fetchSpy = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input.toString();
      requestedUrls.push(url);
      if (!url.startsWith('data:')) {
        throw new Error(`generateResumePdfBlob must not perform network requests (got: ${url})`);
      }
      return originalFetch(input, init);
    });
    vi.stubGlobal('fetch', fetchSpy);

    try {
      await generateResumePdfBlob(
        buildResume({
          profileSummary: 'A short summary.',
          experience: [buildRole('exp-1', 3)],
        }),
      );
      expect(requestedUrls.every((url) => url.startsWith('data:'))).toBe(true);
    } finally {
      vi.stubGlobal('fetch', originalFetch);
    }
  });

  it('represents contact/profile links as clickable PDF link annotations', async () => {
    const blob = await generateResumePdfBlob(
      buildResume({
        contact: {
          fullName: 'Jamie Rivera',
          email: 'jamie.rivera@example.com',
          github: 'https://github.com/jamierivera',
          linkedin: 'https://linkedin.com/in/jamierivera',
          otherLinks: [],
        },
      }),
    );

    const text = await blobToLatin1Text(blob);
    expect(text).toContain('mailto:jamie.rivera@example.com');
    expect(text).toContain('https://github.com/jamierivera');
    expect(text).toContain('https://linkedin.com/in/jamierivera');
  });

  it('represents a publication URL as a clickable PDF link annotation', async () => {
    const blob = await generateResumePdfBlob(
      buildResume({
        publications: [
          { id: 'pub-1', title: 'A Great Paper', url: 'https://example.com/great-paper' },
        ],
      }),
    );

    const text = await blobToLatin1Text(blob);
    expect(text).toContain('https://example.com/great-paper');
  });

  it('creates multiple PDF pages for a long resume', async () => {
    const longResume = buildResume({
      profileSummary: 'A'.repeat(400),
      skills: Array.from({ length: 30 }, (_, i) => `Skill ${i}`),
      experience: Array.from({ length: 8 }, (_, i) => buildRole(`exp-${i}`, 6)),
      education: Array.from({ length: 5 }, (_, i) => ({ id: `edu-${i}`, institution: `University ${i}` })),
    });

    const expectedPageCount = paginateResume(longResume).length;
    expect(expectedPageCount).toBeGreaterThan(1);

    const blob = await generateResumePdfBlob(longResume);
    const text = await blobToLatin1Text(blob);

    const countMatch = text.match(/\/Type\s*\/Pages[^>]*?\/Count\s+(\d+)/) ?? text.match(/\/Count\s+(\d+)[^>]*?\/Type\s*\/Pages/);
    expect(countMatch).not.toBeNull();
    expect(Number(countMatch![1])).toBe(expectedPageCount);
  });

  it('produces a single-page PDF for a short resume', async () => {
    const shortResume = buildResume({
      profileSummary: 'A short summary.',
      skills: ['Python'],
      experience: [buildRole('exp-1', 1)],
    });

    expect(paginateResume(shortResume)).toHaveLength(1);

    const blob = await generateResumePdfBlob(shortResume);
    const text = await blobToLatin1Text(blob);
    const countMatch = text.match(/\/Count\s+(\d+)/);
    expect(Number(countMatch![1])).toBe(1);
  });

  it('produces a meaningfully smaller PDF when optional sections are empty', async () => {
    const minimalResume = buildResume({ profileSummary: 'A short summary.' });
    const fullResume = buildResume({
      profileSummary: 'A short summary.',
      skills: ['Python', 'Terraform', 'AWS'],
      experience: [buildRole('exp-1', 4)],
      education: [{ id: 'edu-1', institution: 'State University', degree: 'B.S. Computer Science' }],
      certifications: [{ id: 'cert-1', name: 'AWS Certified Solutions Architect' }],
      projects: [{ id: 'proj-1', name: 'Side Project', technologies: ['React'] }],
      awards: [{ id: 'award-1', title: 'Employee of the Year' }],
      publications: [{ id: 'pub-1', title: 'A Great Paper' }],
      volunteerExperience: [{ id: 'vol-1', organization: 'Food Bank' }],
      professionalAffiliations: [{ id: 'aff-1', organization: 'ACM' }],
    });

    const minimalBlob = await generateResumePdfBlob(minimalResume);
    const fullBlob = await generateResumePdfBlob(fullResume);

    expect(minimalBlob.size).toBeLessThan(fullBlob.size);
  });
});
