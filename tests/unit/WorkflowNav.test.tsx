import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../../src/app/App';
import { WORKFLOW_STEPS } from '../../src/app/workflow';

describe('workflow navigation', () => {
  it('renders a navigation control for every workflow step', () => {
    render(<App />);

    const nav = screen.getByRole('navigation', { name: /workflow steps/i });
    for (const step of WORKFLOW_STEPS) {
      expect(
        screen.getByRole('button', { name: step.label }),
      ).toBeInTheDocument();
    }
    expect(nav).toBeInTheDocument();
  });

  it('navigates between workflow steps when a nav button is clicked', async () => {
    const user = userEvent.setup();
    render(<App />);

    // Starts on the first step.
    expect(screen.getByRole('heading', { name: /configure/i })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Job Description' }));

    expect(
      screen.getByRole('heading', { name: /job description/i }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Cover Letter' }));

    expect(
      screen.getByRole('heading', { name: /cover letter/i }),
    ).toBeInTheDocument();
  });

  it('marks the active step for assistive technology', async () => {
    const user = userEvent.setup();
    render(<App />);

    const configureButton = screen.getByRole('button', { name: 'Configure' });
    expect(configureButton).toHaveAttribute('aria-current', 'step');

    const resumeButton = screen.getByRole('button', { name: 'Resume' });
    await user.click(resumeButton);

    expect(resumeButton).toHaveAttribute('aria-current', 'step');
    expect(configureButton).not.toHaveAttribute('aria-current');
  });
});
