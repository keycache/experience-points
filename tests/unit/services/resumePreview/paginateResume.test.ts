import { describe, expect, it } from 'vitest';
import { paginateResumeBlocks, paginateResume } from '../../../../src/services/resume-preview/paginateResume';
import { buildResumeLayoutBlocks, type ResumeLayoutBlock } from '../../../../src/services/resume-preview/layoutBlocks';
import { DEFAULT_RESUME_TEMPLATE, getContentHeightPt } from '../../../../src/components/resume-document/template';
import { ResumeSchema, type Resume } from '../../../../src/schemas/resume';

function block(kind: ResumeLayoutBlock['kind'], heightPt: number, extra: Record<string, unknown> = {}) {
  return { kind, heightPt, ...extra } as ResumeLayoutBlock;
}

describe('paginateResumeBlocks', () => {
  it('places all blocks on one page when they fit within the max height', () => {
    const blocks = [block('header', 50), block('summary-body', 30, { text: 'x' })];

    const pages = paginateResumeBlocks(blocks, 200);

    expect(pages).toHaveLength(1);
    expect(pages[0].blocks).toHaveLength(2);
  });

  it('starts a new page when a block would overflow the current page', () => {
    const blocks = [block('header', 100), block('summary-body', 100, { text: 'x' }), block('skills-body', 100, { skills: [] })];

    const pages = paginateResumeBlocks(blocks, 150);

    expect(pages.length).toBeGreaterThan(1);
  });

  it('keeps a section heading with the block that follows it rather than stranding it', () => {
    const blocks = [
      block('header', 90),
      block('section-heading', 20, { sectionKey: 'skills', title: 'Skills' }),
      block('skills-body', 50, { skills: ['A'] }),
    ];

    // Only 30pt remain after the header on a 120pt page: enough for the
    // heading alone (20pt), but not enough for the heading + its body
    // (20 + 50 = 70pt). The heading must move to the next page as well.
    const pages = paginateResumeBlocks(blocks, 120);

    expect(pages).toHaveLength(2);
    expect(pages[0].blocks).toEqual([blocks[0]]);
    expect(pages[1].blocks).toEqual([blocks[1], blocks[2]]);
  });

  it('never splits an experience role heading from its first bullet', () => {
    const roleStart = block('experience-role-start', 80, { experienceId: 'exp-1', firstBulletIndex: 0 });
    const blocks = [block('header', 60), roleStart];

    // Only 40pt remain after the header on a 100pt page — not enough
    // for the atomic role-start block (80pt), so it must move whole.
    const pages = paginateResumeBlocks(blocks, 100);

    expect(pages).toHaveLength(2);
    expect(pages[1].blocks).toEqual([roleStart]);
  });

  it('places an oversized single block on its own page rather than looping forever', () => {
    const blocks = [block('summary-body', 500, { text: 'huge' })];

    const pages = paginateResumeBlocks(blocks, 100);

    expect(pages).toHaveLength(1);
    expect(pages[0].blocks).toEqual(blocks);
  });

  it('returns an empty array for an empty block list', () => {
    expect(paginateResumeBlocks([], 500)).toEqual([]);
  });
});

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
    isCurrent: false,
    endDate: { month: 1, year: 2018 },
    bullets: Array.from({ length: bulletCount }, (_, i) => ({
      id: `${id}-b${i}`,
      text: `Accomplishment number ${i} with a reasonably long, realistic description of impactful work delivered for this role.`,
    })),
  };
}

describe('paginateResume (integration of layout + pagination)', () => {
  it('renders a short resume onto a single page', () => {
    const resume = buildResume({
      profileSummary: 'Short summary.',
      skills: ['Python'],
      experience: [buildRole('exp-1', 2)],
    });

    const pages = paginateResume(resume);

    expect(pages).toHaveLength(1);
  });

  it('renders a long resume onto multiple pages', () => {
    const resume = buildResume({
      profileSummary: 'A'.repeat(400),
      skills: Array.from({ length: 30 }, (_, i) => `Skill ${i}`),
      experience: Array.from({ length: 8 }, (_, i) => buildRole(`exp-${i}`, 6)),
      education: Array.from({ length: 5 }, (_, i) => ({ id: `edu-${i}`, institution: `University ${i}` })),
    });

    const pages = paginateResume(resume);

    expect(pages.length).toBeGreaterThan(1);
  });

  it('never fabricates or drops blocks, and preserves their original order (including role-start/role-rest atomicity)', () => {
    const resume = buildResume({
      // Enough preceding content to push later roles near a page boundary.
      profileSummary: 'A'.repeat(600),
      experience: Array.from({ length: 6 }, (_, i) => buildRole(`exp-${i}`, 3)),
    });

    const pages = paginateResume(resume);
    const flattened = pages.flatMap((page) => page.blocks);
    const original = buildResumeLayoutBlocks(resume, DEFAULT_RESUME_TEMPLATE);

    expect(flattened).toEqual(original);
  });

  it('respects the content height derived from the template margins', () => {
    const resume = buildResume({ profileSummary: 'Short.' });
    const contentHeightPt = getContentHeightPt(DEFAULT_RESUME_TEMPLATE);

    const pages = paginateResume(resume, DEFAULT_RESUME_TEMPLATE);

    const totalHeightPt = pages[0].blocks.reduce((sum, b) => sum + b.heightPt, 0);
    expect(totalHeightPt).toBeLessThanOrEqual(contentHeightPt);
  });
});
