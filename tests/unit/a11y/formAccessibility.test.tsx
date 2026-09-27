import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../../../src/app/App';

/**
 * Targeted accessibility assertions called out explicitly by plan.md
 * Stage 16's "Automated tests" list (complementing the broader axe
 * scans in `axeScan.test.tsx`):
 *
 * - Inputs have accessible names.
 * - Buttons have accessible names.
 * - Errors are associated with controls (via `aria-describedby`).
 * - Modal/dialog controls are keyboard accessible (the app has no
 *   modal `<dialog>` elements; the closest equivalent -- a hidden file
 *   input triggered by a visible button -- is verified keyboard
 *   operable here instead).
 */

async function goToStep(user: ReturnType<typeof userEvent.setup>, name: string) {
  await user.click(screen.getByRole('button', { name }));
}

describe('Form accessibility (Stage 16)', () => {
  it('every textbox/textarea/combobox/checkbox/radio on the Career Profile step has a non-empty accessible name', async () => {
    const user = userEvent.setup();
    render(<App />);
    await goToStep(user, 'Career Profile');

    const controls = [
      ...screen.getAllByRole('textbox'),
      ...screen.queryAllByRole('combobox'),
      ...screen.queryAllByRole('checkbox'),
      ...screen.queryAllByRole('radio'),
    ];

    expect(controls.length).toBeGreaterThan(0);
    for (const control of controls) {
      const name = control.getAttribute('aria-label') ?? '';
      // RTL's accessible-name computation is exercised implicitly by
      // getByRole's `name` matching elsewhere; here we additionally
      // assert every control resolves to a real <label> or aria-label,
      // i.e. it is not just an unlabeled bare input.
      const hasAriaLabel = control.hasAttribute('aria-label') && name.trim().length > 0;
      const hasAriaLabelledBy = control.hasAttribute('aria-labelledby');
      const id = control.getAttribute('id');
      const hasAssociatedLabel = Boolean(id) && document.querySelector(`label[for="${id}"]`) !== null;
      expect(hasAriaLabel || hasAriaLabelledBy || hasAssociatedLabel).toBe(true);
    }
  });

  it('every button across every workflow step has a non-empty accessible name', async () => {
    const user = userEvent.setup();
    render(<App />);

    const stepNames = [
      'Configure',
      'Career Profile',
      'Job Description',
      'Writing Style',
      'Match & Tailor',
      'Resume',
      'Cover Letter',
      'Preview / Export',
    ];

    for (const stepName of stepNames) {
      await goToStep(user, stepName);
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
      for (const button of buttons) {
        const accessibleText = (button.textContent ?? '').trim();
        const ariaLabel = button.getAttribute('aria-label')?.trim() ?? '';
        expect(accessibleText.length > 0 || ariaLabel.length > 0).toBe(true);
      }
    }
  });

  it("associates the Career Profile image validation error with the images input via aria-describedby", async () => {
    const user = userEvent.setup();
    render(<App />);
    await goToStep(user, 'Career Profile');

    const imagesInput = screen.getByLabelText(/images \(e\.g\. resume screenshots\)/i);
    expect(imagesInput).not.toHaveAttribute('aria-describedby');
    expect(imagesInput).not.toHaveAttribute('aria-invalid');

    const invalidImage = new File(['x'], 'notes.bmp', { type: 'image/bmp' });
    await user.upload(imagesInput, invalidImage);

    const alert = await screen.findByRole('alert');
    const describedBy = imagesInput.getAttribute('aria-describedby');
    expect(describedBy).toBeTruthy();
    expect(alert).toHaveAttribute('id', describedBy);
    expect(imagesInput).toHaveAttribute('aria-invalid', 'true');
  });

  it('associates the Job Description import error with the import file input via aria-describedby', async () => {
    const user = userEvent.setup();
    render(<App />);
    await goToStep(user, 'Job Description');

    const importInput = screen.getByLabelText(/import job description file/i);
    const invalidFile = new File(['{ not valid json'], 'job-description.json', {
      type: 'application/json',
    });
    await user.upload(importInput, invalidFile);

    const alert = await screen.findByRole('alert');
    const describedBy = importInput.getAttribute('aria-describedby');
    expect(describedBy).toBeTruthy();
    expect(alert).toHaveAttribute('id', describedBy);
  });

  it('associates the Resume import error with the import file input via aria-describedby', async () => {
    const user = userEvent.setup();
    render(<App />);
    await goToStep(user, 'Resume');

    const importInput = screen.getByLabelText(/import resume file/i);
    const invalidFile = new File(['{ not valid json'], 'resume.json', { type: 'application/json' });
    await user.upload(importInput, invalidFile);

    const alert = await screen.findByRole('alert');
    const describedBy = importInput.getAttribute('aria-describedby');
    expect(describedBy).toBeTruthy();
    expect(alert).toHaveAttribute('id', describedBy);
  });

  it('associates the Cover Letter import error with the import file input via aria-describedby', async () => {
    const user = userEvent.setup();
    render(<App />);
    await goToStep(user, 'Cover Letter');

    const importInput = screen.getByLabelText(/import cover letter file/i);
    const invalidFile = new File(['{ not valid json'], 'cover-letter.json', {
      type: 'application/json',
    });
    await user.upload(importInput, invalidFile);

    const alert = await screen.findByRole('alert');
    const describedBy = importInput.getAttribute('aria-describedby');
    expect(describedBy).toBeTruthy();
    expect(alert).toHaveAttribute('id', describedBy);
  });

  it('the hidden "Import…" file input is keyboard-operable: activating the visible trigger button opens the file picker', async () => {
    const user = userEvent.setup();
    render(<App />);
    await goToStep(user, 'Career Profile');

    const importInput = screen.getByLabelText(/import career profile file/i) as HTMLInputElement;
    const clickSpy = vi.spyOn(importInput, 'click');

    await user.tab(); // focus something first so Tab-navigation below is meaningful
    const importButton = screen.getByRole('button', { name: /import existing career profile/i });
    importButton.focus();
    expect(importButton).toHaveFocus();

    await user.keyboard('{Enter}');
    expect(clickSpy).toHaveBeenCalledTimes(1);

    clickSpy.mockRestore();
  });

  it('the Resume live preview uses a proper nested heading hierarchy (h2 step > h3 name > h4 sections)', async () => {
    const user = userEvent.setup();
    render(<App />);
    await goToStep(user, 'Resume');

    const envelope = JSON.stringify({
      schema_version: '1.0',
      type: 'resume',
      data: {
        contact: { fullName: 'Jamie Rivera', otherLinks: [] },
        profileSummary: 'Short summary.',
        skills: ['Python'],
        experience: [],
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
    await user.upload(
      screen.getByLabelText(/import resume file/i),
      new File([envelope], 'resume.json', { type: 'application/json' }),
    );
    await screen.findByLabelText('Full name');

    await goToStep(user, 'Preview / Export');

    const stepHeading = screen.getByRole('heading', { level: 2, name: 'Preview / Export' });
    const nameHeading = screen.getByRole('heading', { level: 3, name: 'Jamie Rivera' });
    const sectionHeading = screen.getByRole('heading', { level: 4, name: 'Profile Summary' });

    expect(stepHeading).toBeInTheDocument();
    expect(nameHeading).toBeInTheDocument();
    expect(sectionHeading).toBeInTheDocument();
    // No duplicate top-level <h1> anywhere below the app's own title.
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  });
});
