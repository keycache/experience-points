import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import userEvent from '@testing-library/user-event';
import App from '../../../src/app/App';

/**
 * Automated accessibility scans (plan.md Stage 16; specification.md
 * section 19) using `jest-axe` (axe-core) against every workflow step
 * as rendered by the real `<App />`.
 *
 * `color-contrast` is disabled here: jsdom does not perform real
 * layout/paint, so axe-core's contrast checker cannot reliably read
 * computed colors in this environment and would otherwise produce
 * noisy false positives/negatives. Contrast was instead verified
 * manually (computed contrast ratios for the stylesheet's actual
 * color values, and a manual Chrome DevTools/Lighthouse pass) --- see
 * `/memories/repo/project-structure.md` Stage 16 notes.
 */
const AXE_OPTIONS = { rules: { 'color-contrast': { enabled: false } } };

async function goToStep(user: ReturnType<typeof userEvent.setup>, name: string) {
  await user.click(screen.getByRole('button', { name }));
}

describe('Accessibility scan: every workflow step (Stage 16)', () => {
  it('Configure step has no axe violations', async () => {
    const { container } = render(<App />);
    expect(await axe(container, AXE_OPTIONS)).toHaveNoViolations();
  });

  it('Career Profile step (empty state) has no axe violations', async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);
    await goToStep(user, 'Career Profile');
    expect(await axe(container, AXE_OPTIONS)).toHaveNoViolations();
  });

  it('Job Description step (empty state) has no axe violations', async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);
    await goToStep(user, 'Job Description');
    expect(await axe(container, AXE_OPTIONS)).toHaveNoViolations();
  });

  it('Writing Style step has no axe violations', async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);
    await goToStep(user, 'Writing Style');
    expect(await axe(container, AXE_OPTIONS)).toHaveNoViolations();
  });

  it('Match & Tailor step (empty state) has no axe violations', async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);
    await goToStep(user, 'Match & Tailor');
    expect(await axe(container, AXE_OPTIONS)).toHaveNoViolations();
  });

  it('Resume step (empty state) has no axe violations', async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);
    await goToStep(user, 'Resume');
    expect(await axe(container, AXE_OPTIONS)).toHaveNoViolations();
  });

  it('Cover Letter step (empty state) has no axe violations', async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);
    await goToStep(user, 'Cover Letter');
    expect(await axe(container, AXE_OPTIONS)).toHaveNoViolations();
  });

  it('Preview / Export step (empty state) has no axe violations', async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);
    await goToStep(user, 'Preview / Export');
    expect(await axe(container, AXE_OPTIONS)).toHaveNoViolations();
  });

  it('a fully populated Resume editor + live preview has no axe violations', async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);
    await goToStep(user, 'Resume');

    const envelope = JSON.stringify({
      schema_version: '1.0',
      type: 'resume',
      data: {
        contact: {
          fullName: 'Jamie Rivera',
          location: 'Austin, TX',
          email: 'jamie.rivera@example.com',
          phone: '555-123-4567',
          website: 'https://jamierivera.dev',
          github: 'https://github.com/jamierivera',
          linkedin: 'https://linkedin.com/in/jamierivera',
          otherLinks: [{ label: 'Portfolio', url: 'https://jamierivera.dev/portfolio' }],
        },
        profileSummary: 'Platform engineer specializing in cloud infrastructure.',
        skills: ['Python', 'Terraform'],
        experience: [
          {
            id: 'res-exp-1',
            company: 'Initech',
            role: 'Senior Platform Engineer',
            startDate: { month: 3, year: 2021 },
            isCurrent: true,
            bullets: [
              { id: 'b1', text: 'Led migration of Terraform stacks to OpenTofu.' },
              { id: 'b2', text: 'Automated deployment pipelines.' },
            ],
          },
        ],
        education: [{ id: 'edu-1', institution: 'State University', degree: 'B.S. Computer Science' }],
        certifications: [],
        projects: [],
        awards: [],
        publications: [],
        volunteerExperience: [],
        professionalAffiliations: [],
        customSections: [],
      },
    });
    const file = new File([envelope], 'resume.json', { type: 'application/json' });
    await user.upload(screen.getByLabelText(/import resume file/i), file);
    await screen.findByLabelText('Full name');

    expect(await axe(container, AXE_OPTIONS)).toHaveNoViolations();

    await goToStep(user, 'Preview / Export');
    expect(await axe(container, AXE_OPTIONS)).toHaveNoViolations();
  });

  it('a validation error state (invalid image) has no axe violations', async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);
    await goToStep(user, 'Career Profile');

    // `accept="image/*"` on the input makes user-event's upload() only
    // "select" files whose MIME type matches the image/* pattern, so
    // the file used here must still start with "image/" to actually
    // reach the change handler -- it is simply not one of the
    // explicitly accepted image MIME types (PNG/JPEG/WEBP/GIF).
    const invalidImage = new File(['not-a-real-bitmap'], 'notes.bmp', { type: 'image/bmp' });
    await user.upload(screen.getByLabelText(/images \(e\.g\. resume screenshots\)/i), invalidImage);
    await screen.findByRole('alert');

    expect(await axe(container, AXE_OPTIONS)).toHaveNoViolations();
  });
});
