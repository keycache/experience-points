import { describe, expect, it } from 'vitest';
import { resolveResumeTemplate, resolveResumeLayout } from '../../../../src/services/resume-preview/layoutOptimization';
import { paginateResume } from '../../../../src/services/resume-preview/paginateResume';
import { DEFAULT_RESUME_TEMPLATE } from '../../../../src/components/resume-document/template';
import { ResumeSchema, type Resume } from '../../../../src/schemas/resume';

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

function buildLongResume(pageCountPreference?: Resume['constraints']['pageCountPreference']) {
  return buildResume({
    profileSummary: 'A'.repeat(400),
    skills: Array.from({ length: 30 }, (_, i) => `Skill ${i}`),
    experience: Array.from({ length: 10 }, (_, i) => buildRole(`exp-${i}`, 6)),
    education: Array.from({ length: 5 }, (_, i) => ({ id: `edu-${i}`, institution: `University ${i}` })),
    ...(pageCountPreference !== undefined
      ? { constraints: { pageCountPreference } }
      : {}),
  });
}

function buildShortResume(pageCountPreference?: Resume['constraints']['pageCountPreference']) {
  return buildResume({
    profileSummary: 'Short summary.',
    skills: ['Python'],
    experience: [buildRole('exp-1', 2)],
    ...(pageCountPreference !== undefined
      ? { constraints: { pageCountPreference } }
      : {}),
  });
}

describe('resolveResumeTemplate', () => {
  it('returns the base template unchanged when there is no page-count preference', () => {
    const resume = buildLongResume('no-preference');

    const template = resolveResumeTemplate(resume);

    expect(template).toEqual(DEFAULT_RESUME_TEMPLATE);
  });

  it('does not compress content that already fits within the requested page count', () => {
    const resume = buildShortResume(3);
    const naturalPageCount = paginateResume(resume, DEFAULT_RESUME_TEMPLATE).length;
    expect(naturalPageCount).toBeLessThanOrEqual(3);

    const template = resolveResumeTemplate(resume);

    expect(template).toEqual(DEFAULT_RESUME_TEMPLATE);
  });

  it('compresses long content to try to reach a lower requested page count', () => {
    const resume = buildLongResume();
    const naturalPageCount = paginateResume(resume, DEFAULT_RESUME_TEMPLATE).length;
    expect(naturalPageCount).toBeGreaterThan(1);

    resume.constraints.pageCountPreference = Math.max(1, naturalPageCount - 1);
    const template = resolveResumeTemplate(resume);

    // A more compact template must actually be more compact along at
    // least one of the dimensions the renderers honor.
    const isMoreCompact =
      template.baseFontSizePt < DEFAULT_RESUME_TEMPLATE.baseFontSizePt ||
      template.lineHeight < DEFAULT_RESUME_TEMPLATE.lineHeight ||
      template.marginsPt.top < DEFAULT_RESUME_TEMPLATE.marginsPt.top;
    expect(isMoreCompact).toBe(true);
  });

  it('never reduces the base font size below a readable floor, even for an extremely long resume with a 1-page target', () => {
    const resume = buildResume({
      profileSummary: 'A'.repeat(1000),
      skills: Array.from({ length: 60 }, (_, i) => `Skill ${i}`),
      experience: Array.from({ length: 25 }, (_, i) => buildRole(`exp-${i}`, 6)),
      constraints: { pageCountPreference: 1 },
    });

    const template = resolveResumeTemplate(resume);

    expect(template.baseFontSizePt).toBeGreaterThanOrEqual(9);
    expect(template.marginsPt.top).toBeGreaterThanOrEqual(24);
    expect(template.lineHeight).toBeGreaterThanOrEqual(1);
  });

  it('never drops or reorders content even when the target page count cannot be reached', () => {
    const resume = buildResume({
      profileSummary: 'A'.repeat(1000),
      skills: Array.from({ length: 60 }, (_, i) => `Skill ${i}`),
      experience: Array.from({ length: 25 }, (_, i) => buildRole(`exp-${i}`, 6)),
      constraints: { pageCountPreference: 1 },
    });

    const { pages } = resolveResumeLayout(resume);
    const flattenedBlockCount = pages.reduce((sum, page) => sum + page.blocks.length, 0);
    const naturalBlockCount = paginateResume(resume, DEFAULT_RESUME_TEMPLATE).reduce(
      (sum, page) => sum + page.blocks.length,
      0,
    );

    expect(flattenedBlockCount).toBe(naturalBlockCount);
  });
});

describe('resolveResumeLayout', () => {
  it('pairs the resolved template with pages computed using that same template', () => {
    const resume = buildLongResume();
    const naturalPageCount = paginateResume(resume, DEFAULT_RESUME_TEMPLATE).length;
    resume.constraints.pageCountPreference = Math.max(1, naturalPageCount - 1);

    const { template, pages } = resolveResumeLayout(resume);

    expect(pages).toEqual(paginateResume(resume, template));
  });

  it('produces a shorter or equal page count than the base template for a compressible resume', () => {
    const resume = buildLongResume();
    const naturalPageCount = paginateResume(resume, DEFAULT_RESUME_TEMPLATE).length;
    resume.constraints.pageCountPreference = Math.max(1, naturalPageCount - 1);

    const { pages } = resolveResumeLayout(resume);

    expect(pages.length).toBeLessThanOrEqual(naturalPageCount);
  });
});
