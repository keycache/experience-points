import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { ResumeDocument } from '../../../src/components/resume-document/ResumeDocument';
import { ResumeSchema, type Resume } from '../../../src/schemas/resume';

function buildResume(overrides: Record<string, unknown> = {}): Resume {
  return ResumeSchema.parse({
    contact: { fullName: 'Jamie Rivera' },
    ...overrides,
  });
}

describe('ResumeDocument', () => {
  it('renders every major section when the resume has data for it', () => {
    render(
      <ResumeDocument
        resume={buildResume({
          contact: { fullName: 'Jamie Rivera', email: 'jamie@example.com', otherLinks: [] },
          profileSummary: 'A concise, JD-specific summary.',
          skills: ['Python', 'Terraform'],
          experience: [
            {
              id: 'exp-1',
              company: 'Initech',
              role: 'Senior Engineer',
              startDate: { month: 3, year: 2021 },
              isCurrent: true,
              bullets: [{ id: 'b1', text: 'Led a migration.' }],
            },
          ],
          education: [{ id: 'edu-1', institution: 'State University', degree: 'B.S. Computer Science' }],
          certifications: [{ id: 'cert-1', name: 'AWS Certified Solutions Architect' }],
          projects: [{ id: 'proj-1', name: 'Side Project', technologies: ['React'] }],
          awards: [{ id: 'award-1', title: 'Employee of the Year' }],
          publications: [{ id: 'pub-1', title: 'A Great Paper' }],
          volunteerExperience: [{ id: 'vol-1', organization: 'Food Bank' }],
          professionalAffiliations: [{ id: 'aff-1', organization: 'ACM' }],
          customSections: [{ id: 'custom-1', title: 'Languages', content: 'English, Spanish' }],
        })}
      />,
    );

    expect(screen.getByText('Jamie Rivera')).toBeInTheDocument();
    expect(screen.getByText('A concise, JD-specific summary.')).toBeInTheDocument();
    expect(screen.getByText('Python')).toBeInTheDocument();
    expect(screen.getByText('Led a migration.')).toBeInTheDocument();
    expect(screen.getByText(/State University/)).toBeInTheDocument();
    expect(screen.getByText('AWS Certified Solutions Architect')).toBeInTheDocument();
    expect(screen.getByText('Side Project')).toBeInTheDocument();
    expect(screen.getByText('Employee of the Year')).toBeInTheDocument();
    expect(screen.getByText('A Great Paper')).toBeInTheDocument();
    expect(screen.getByText('Food Bank')).toBeInTheDocument();
    expect(screen.getByText('ACM')).toBeInTheDocument();
    expect(screen.getByText('Languages')).toBeInTheDocument();
    expect(screen.getByText('English, Spanish')).toBeInTheDocument();
  });

  it('renders contact/profile links as clickable anchors', () => {
    render(
      <ResumeDocument
        resume={buildResume({
          contact: {
            fullName: 'Jamie Rivera',
            email: 'jamie@example.com',
            website: 'https://jamie.example.com',
            github: 'https://github.com/jamierivera',
            linkedin: 'https://linkedin.com/in/jamierivera',
            otherLinks: [{ label: 'Portfolio', url: 'https://portfolio.example.com' }],
          },
          publications: [{ id: 'pub-1', title: 'A Great Paper', url: 'https://example.com/paper' }],
        })}
      />,
    );

    expect(screen.getByRole('link', { name: 'jamie@example.com' })).toHaveAttribute(
      'href',
      'mailto:jamie@example.com',
    );
    expect(screen.getByRole('link', { name: 'Website' })).toHaveAttribute('href', 'https://jamie.example.com');
    expect(screen.getByRole('link', { name: 'GitHub' })).toHaveAttribute('href', 'https://github.com/jamierivera');
    expect(screen.getByRole('link', { name: 'LinkedIn' })).toHaveAttribute(
      'href',
      'https://linkedin.com/in/jamierivera',
    );
    expect(screen.getByRole('link', { name: 'Portfolio' })).toHaveAttribute(
      'href',
      'https://portfolio.example.com',
    );
    expect(screen.getByRole('link', { name: 'A Great Paper' })).toHaveAttribute(
      'href',
      'https://example.com/paper',
    );
  });

  it('omits sections with no data instead of rendering an empty heading', () => {
    render(<ResumeDocument resume={buildResume()} />);

    expect(screen.queryByText('Profile Summary')).not.toBeInTheDocument();
    expect(screen.queryByText('Skills')).not.toBeInTheDocument();
    expect(screen.queryByText('Professional Experience')).not.toBeInTheDocument();
    expect(screen.queryByText('Education')).not.toBeInTheDocument();
    expect(screen.queryByText('Certifications')).not.toBeInTheDocument();
  });

  it('renders multiple roles correctly, each with its own heading and bullets', () => {
    render(
      <ResumeDocument
        resume={buildResume({
          experience: [
            {
              id: 'exp-1',
              company: 'Initech',
              role: 'Senior Engineer',
              startDate: { month: 3, year: 2021 },
              isCurrent: true,
              bullets: [{ id: 'b1', text: 'Led a migration at Initech.' }],
            },
            {
              id: 'exp-2',
              company: 'Globex',
              role: 'Engineer',
              startDate: { month: 1, year: 2015 },
              endDate: { month: 1, year: 2020 },
              isCurrent: false,
              bullets: [{ id: 'b2', text: 'Maintained legacy systems at Globex.' }],
            },
          ],
        })}
      />,
    );

    expect(screen.getByRole('group', { name: 'Initech role' })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Globex role' })).toBeInTheDocument();
    expect(screen.getByText('Led a migration at Initech.')).toBeInTheDocument();
    expect(screen.getByText('Maintained legacy systems at Globex.')).toBeInTheDocument();
  });

  it('renders a long bullet in full, allowed to wrap rather than being truncated', () => {
    const longBulletText =
      'This is a very long bullet point describing a great deal of impactful work delivered across many systems, teams, and quarters, without any truncation whatsoever.';

    render(
      <ResumeDocument
        resume={buildResume({
          experience: [
            {
              id: 'exp-1',
              company: 'Initech',
              role: 'Senior Engineer',
              startDate: { month: 3, year: 2021 },
              isCurrent: true,
              bullets: [{ id: 'b1', text: longBulletText }],
            },
          ],
        })}
      />,
    );

    const bullet = screen.getByText(longBulletText);
    expect(bullet).toBeInTheDocument();
    expect(bullet).toHaveClass('resume-doc__bullet');
  });

  it('renders a long company name in full, allowed to wrap rather than being truncated', () => {
    const longCompanyName =
      'A Very Long Multinational Conglomerate Holding Company Name That Keeps Going And Going';

    render(
      <ResumeDocument
        resume={buildResume({
          experience: [
            {
              id: 'exp-1',
              company: longCompanyName,
              role: 'Senior Engineer',
              startDate: { month: 3, year: 2021 },
              isCurrent: true,
              bullets: [{ id: 'b1', text: 'Did great work.' }],
            },
          ],
        })}
      />,
    );

    expect(screen.getByText(longCompanyName)).toBeInTheDocument();
    expect(screen.getByRole('group', { name: `${longCompanyName} role` })).toBeInTheDocument();
  });

  it('renders multiple pages for a long resume', () => {
    render(
      <ResumeDocument
        resume={buildResume({
          profileSummary: 'A'.repeat(400),
          skills: Array.from({ length: 30 }, (_, i) => `Skill ${i}`),
          experience: Array.from({ length: 8 }, (_, i) => ({
            id: `exp-${i}`,
            company: `Company ${i}`,
            role: 'Engineer',
            startDate: { month: 1, year: 2015 },
            endDate: { month: 1, year: 2018 },
            isCurrent: false,
            bullets: Array.from({ length: 6 }, (_, j) => ({
              id: `exp-${i}-b${j}`,
              text: `Accomplishment number ${j} with a reasonably long, realistic description of impactful work.`,
            })),
          })),
        })}
      />,
    );

    const pages = screen.getAllByRole('region');
    expect(pages.length).toBeGreaterThan(1);
  });

  it('never splits a role heading from its first bullet across a page break', () => {
    render(
      <ResumeDocument
        resume={buildResume({
          // Enough preceding content to push roles across several page boundaries.
          profileSummary: 'A'.repeat(400),
          skills: Array.from({ length: 20 }, (_, i) => `Skill ${i}`),
          experience: Array.from({ length: 10 }, (_, i) => ({
            id: `exp-${i}`,
            company: `Company ${i}`,
            role: 'Engineer',
            startDate: { month: 1, year: 2015 },
            endDate: { month: 1, year: 2018 },
            isCurrent: false,
            bullets: Array.from({ length: 5 }, (_, j) => ({
              id: `exp-${i}-b${j}`,
              text: `Bullet ${j} for Company ${i} with a realistic length of descriptive text about impactful work.`,
            })),
          })),
        })}
      />,
    );

    const pages = screen.getAllByRole('region');
    expect(pages.length).toBeGreaterThan(1);

    // For every role, its heading and first bullet must appear within
    // the SAME page container (the "role" group is only ever rendered
    // once, as a single atomic unit).
    for (let i = 0; i < 10; i += 1) {
      const roleGroup = screen.getByRole('group', { name: `Company ${i} role` });
      const containingPage = pages.find((page) => page.contains(roleGroup));
      expect(containingPage).toBeDefined();
      expect(within(containingPage!).getByText(`Company ${i}`)).toBeInTheDocument();
      expect(
        within(roleGroup).getByText(`Bullet 0 for Company ${i} with a realistic length of descriptive text about impactful work.`),
      ).toBeInTheDocument();
    }
  });
});
