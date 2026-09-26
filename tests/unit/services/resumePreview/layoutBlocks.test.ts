import { describe, expect, it } from 'vitest';
import { buildResumeLayoutBlocks } from '../../../../src/services/resume-preview/layoutBlocks';
import { DEFAULT_RESUME_TEMPLATE } from '../../../../src/components/resume-document/template';
import { ResumeSchema, type Resume } from '../../../../src/schemas/resume';

function buildResume(overrides: Record<string, unknown> = {}): Resume {
  return ResumeSchema.parse({
    contact: { fullName: 'Jamie Rivera' },
    ...overrides,
  });
}

describe('buildResumeLayoutBlocks', () => {
  it('always includes a header block', () => {
    const blocks = buildResumeLayoutBlocks(buildResume(), DEFAULT_RESUME_TEMPLATE);
    expect(blocks[0].kind).toBe('header');
  });

  it('omits sections with no data', () => {
    const blocks = buildResumeLayoutBlocks(buildResume(), DEFAULT_RESUME_TEMPLATE);

    expect(blocks.some((block) => block.kind === 'section-heading' && block.sectionKey === 'summary')).toBe(
      false,
    );
    expect(blocks.some((block) => block.kind === 'section-heading' && block.sectionKey === 'skills')).toBe(
      false,
    );
    expect(
      blocks.some((block) => block.kind === 'section-heading' && block.sectionKey === 'experience'),
    ).toBe(false);
  });

  it('includes a section heading and body when the summary is present', () => {
    const blocks = buildResumeLayoutBlocks(
      buildResume({ profileSummary: 'A concise summary.' }),
      DEFAULT_RESUME_TEMPLATE,
    );

    expect(blocks.some((block) => block.kind === 'section-heading' && block.sectionKey === 'summary')).toBe(
      true,
    );
    expect(blocks.some((block) => block.kind === 'summary-body')).toBe(true);
  });

  it('creates one experience-role-start block combining the heading and first bullet', () => {
    const blocks = buildResumeLayoutBlocks(
      buildResume({
        experience: [
          {
            id: 'exp-1',
            company: 'Initech',
            role: 'Engineer',
            startDate: { month: 1, year: 2020 },
            isCurrent: true,
            bullets: [
              { id: 'b1', text: 'First bullet.' },
              { id: 'b2', text: 'Second bullet.' },
            ],
          },
        ],
      }),
      DEFAULT_RESUME_TEMPLATE,
    );

    const roleStart = blocks.find((block) => block.kind === 'experience-role-start');
    const roleRest = blocks.find((block) => block.kind === 'experience-role-rest');
    expect(roleStart).toBeDefined();
    expect(roleRest).toBeDefined();
  });

  it('does not create a role-rest block when a role has only one bullet', () => {
    const blocks = buildResumeLayoutBlocks(
      buildResume({
        experience: [
          {
            id: 'exp-1',
            company: 'Initech',
            role: 'Engineer',
            startDate: { month: 1, year: 2020 },
            isCurrent: true,
            bullets: [{ id: 'b1', text: 'Only bullet.' }],
          },
        ],
      }),
      DEFAULT_RESUME_TEMPLATE,
    );

    expect(blocks.some((block) => block.kind === 'experience-role-rest')).toBe(false);
  });

  it('creates one entry block per item for a populated section', () => {
    const blocks = buildResumeLayoutBlocks(
      buildResume({
        education: [
          { id: 'edu-1', institution: 'State University' },
          { id: 'edu-2', institution: 'Tech Institute' },
        ],
      }),
      DEFAULT_RESUME_TEMPLATE,
    );

    const entries = blocks.filter((block) => block.kind === 'entry' && block.sectionKey === 'education');
    expect(entries).toHaveLength(2);
  });

  it('estimates a taller block for longer text (long bullets / long names produce more estimated height)', () => {
    const shortBlocks = buildResumeLayoutBlocks(
      buildResume({
        experience: [
          {
            id: 'exp-1',
            company: 'A',
            role: 'B',
            startDate: { month: 1, year: 2020 },
            isCurrent: true,
            bullets: [{ id: 'b1', text: 'Short.' }],
          },
        ],
      }),
      DEFAULT_RESUME_TEMPLATE,
    );
    const longBlocks = buildResumeLayoutBlocks(
      buildResume({
        experience: [
          {
            id: 'exp-1',
            company: 'A Very Long Company Name That Keeps Going On And On',
            role: 'A Very Long Role Title That Also Keeps Going On And On',
            startDate: { month: 1, year: 2020 },
            isCurrent: true,
            bullets: [
              {
                id: 'b1',
                text: 'A very long bullet point that describes a great deal of impactful work across many systems and teams over a long period of time.',
              },
            ],
          },
        ],
      }),
      DEFAULT_RESUME_TEMPLATE,
    );

    const shortRoleStart = shortBlocks.find((block) => block.kind === 'experience-role-start')!;
    const longRoleStart = longBlocks.find((block) => block.kind === 'experience-role-start')!;
    expect(longRoleStart.heightPt).toBeGreaterThan(shortRoleStart.heightPt);
  });

  it('creates a heading and body block for each custom section', () => {
    const blocks = buildResumeLayoutBlocks(
      buildResume({
        customSections: [{ id: 'cs-1', title: 'Languages', content: 'English, Spanish' }],
      }),
      DEFAULT_RESUME_TEMPLATE,
    );

    expect(blocks.some((block) => block.kind === 'custom-section-heading' && block.title === 'Languages')).toBe(
      true,
    );
    expect(blocks.some((block) => block.kind === 'custom-section-body')).toBe(true);
  });
});
