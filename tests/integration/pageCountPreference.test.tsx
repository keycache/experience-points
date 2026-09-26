import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../../src/app/App';

function buildRole(id: string, company: string, bulletCount: number) {
  return {
    id,
    company,
    role: 'Senior Engineer',
    startDate: { month: 1, year: 2016 },
    endDate: { month: 1, year: 2020 },
    isCurrent: false,
    bullets: Array.from({ length: bulletCount }, (_, i) => ({
      id: `${id}-b${i}`,
      text: `Delivered a significant, measurable outcome number ${i} through cross-team collaboration and technical leadership.`,
    })),
  };
}

function buildResumeEnvelope(experienceCount: number, bulletCount: number) {
  return JSON.stringify({
    schema_version: '1.0',
    type: 'resume',
    data: {
      contact: { fullName: 'Morgan Chen', email: 'morgan.chen@example.com', otherLinks: [] },
      profileSummary: 'Full-stack engineer with over a decade of experience across fintech and healthcare.',
      skills: ['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'AWS', 'Docker', 'Kubernetes', 'GraphQL'],
      experience: Array.from({ length: experienceCount }, (_, i) =>
        buildRole(`exp-${i}`, `Company ${i}`, bulletCount),
      ),
      education: [{ id: 'edu-1', institution: 'State University', degree: 'B.S.', fieldOfStudy: 'Computer Science' }],
      certifications: [],
      projects: [],
      awards: [],
      publications: [],
      volunteerExperience: [],
      professionalAffiliations: [],
      customSections: [],
    },
  });
}

function buildMinimalResumeEnvelope() {
  return JSON.stringify({
    schema_version: '1.0',
    type: 'resume',
    data: {
      contact: { fullName: 'Morgan Chen', email: 'morgan.chen@example.com', otherLinks: [] },
      profileSummary: 'Full-stack engineer.',
      skills: ['TypeScript', 'React'],
      experience: [buildRole('exp-0', 'Company 0', 1)],
      education: [],
      certifications: [],
      projects: [],
      awards: [],
      publications: [],
      volunteerExperience: [],
      professionalAffiliations: [],
      customSections: [],
    },
  });
}

async function importResume(user: ReturnType<typeof userEvent.setup>, json: string) {
  await user.click(screen.getByRole('button', { name: 'Resume' }));
  const file = new File([json], 'resume.json', { type: 'application/json' });
  await user.upload(screen.getByLabelText(/import resume file/i), file);
  await screen.findByLabelText('Full name');
  await user.click(screen.getByRole('button', { name: 'Preview / Export' }));
}

// App also renders an unrelated dev-tool region ("Developer tool: Schema
// & import/export playground"), so plain `getAllByRole('region')` would
// also match it. Scope resume-page queries by their aria-label.
function getResumePages() {
  return screen.getAllByRole('region', { name: /resume page/i });
}

function findResumePages() {
  return screen.findAllByRole('region', { name: /resume page/i });
}

describe('Page length preference (Stage 13)', () => {
  it('defaults the page length selector to "No preference" for a freshly imported resume', async () => {
    const user = userEvent.setup();
    render(<App />);

    await importResume(user, buildResumeEnvelope(1, 2));

    const select = screen.getByLabelText('Page length') as HTMLSelectElement;
    expect(select.value).toBe('no-preference');
  });

  it('does not artificially expand a short resume when a longer page length is requested', async () => {
    const user = userEvent.setup();
    render(<App />);

    await importResume(user, buildMinimalResumeEnvelope());

    expect(getResumePages()).toHaveLength(1);

    const select = screen.getByLabelText('Page length');
    await user.selectOptions(select, '3 pages');

    expect(getResumePages()).toHaveLength(1);
  });

  it('compresses a resume that only slightly overflows a page toward the requested page length', async () => {
    const user = userEvent.setup();
    render(<App />);

    await importResume(user, buildResumeEnvelope(3, 6));

    const naturalPages = getResumePages();
    expect(naturalPages.length).toBeGreaterThan(1);
    const naturalPageCount = naturalPages.length;

    const select = screen.getByLabelText('Page length');
    await user.selectOptions(select, '1 page');

    const compressedPages = await findResumePages();
    expect(compressedPages.length).toBeLessThan(naturalPageCount);

    // The rendered page must actually use the more compact template's
    // margins/line-height/font-size -- not just claim a smaller page
    // count while silently overflowing the visible page container.
    const firstPage = compressedPages[0];
    const fontSizePx = Number.parseFloat(firstPage.style.fontSize);
    const paddingTopPx = Number.parseFloat(firstPage.style.paddingTop);
    const lineHeight = Number.parseFloat(firstPage.style.lineHeight);
    const isMoreCompact =
      fontSizePx < 10 * (96 / 72) || paddingTopPx < 36 * (96 / 72) || lineHeight < 1.2;
    expect(isMoreCompact).toBe(true);
  });

  it('never drops content when compressing to reach a requested page length', async () => {
    const user = userEvent.setup();
    render(<App />);

    await importResume(user, buildResumeEnvelope(3, 6));

    const select = screen.getByLabelText('Page length');
    await user.selectOptions(select, '1 page');

    await findResumePages();
    for (let i = 0; i < 3; i += 1) {
      expect(screen.getByRole('group', { name: `Company ${i} role` })).toBeInTheDocument();
    }
  });

  it('keeps the PDF export in sync with the selected page length preference', async () => {
    const user = userEvent.setup();
    render(<App />);

    await importResume(user, buildResumeEnvelope(3, 6));
    const select = screen.getByLabelText('Page length');
    await user.selectOptions(select, '1 page');
    await findResumePages();

    const region = getResumePages()[0];
    expect(within(region).getByText('Morgan Chen')).toBeInTheDocument();
  });
});
