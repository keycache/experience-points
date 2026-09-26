import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../../src/app/App';

async function goToWritingStyle(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: 'Writing Style' }));
}

describe('Writing Style workflow (Stage 7)', () => {
  it('allows leaving writing style blank and continuing to the next step', async () => {
    const user = userEvent.setup();
    render(<App />);
    await goToWritingStyle(user);

    expect(screen.getByLabelText(/mode/i)).toHaveValue('unspecified');
    expect(screen.getByText(/no style specified/i)).toBeInTheDocument();

    // Continuing to another workflow step should not be blocked or crash.
    await user.click(screen.getByRole('button', { name: 'Match & Tailor' }));
    expect(screen.getByRole('heading', { level: 2, name: /match & tailor/i })).toBeInTheDocument();
  });

  it('accepts and saves raw style text', async () => {
    const user = userEvent.setup();
    render(<App />);
    await goToWritingStyle(user);

    await user.selectOptions(screen.getByLabelText(/mode/i), 'raw');
    await user.type(
      screen.getByLabelText(/raw style guidance/i),
      'Confident, concise, first-person, avoid buzzwords.',
    );

    expect(screen.getByLabelText(/raw style guidance/i)).toHaveValue(
      'Confident, concise, first-person, avoid buzzwords.',
    );
  });

  it('switches to structured style and allows editing structured fields', async () => {
    const user = userEvent.setup();
    render(<App />);
    await goToWritingStyle(user);

    await user.selectOptions(screen.getByLabelText(/mode/i), 'structured');
    await user.type(screen.getByLabelText(/^tone$/i), 'warm and direct');
    await user.selectOptions(screen.getByLabelText(/voice/i), 'first-person');
    await user.selectOptions(screen.getByLabelText(/formality/i), 'formal');
    await user.type(screen.getByLabelText(/additional notes/i), 'Avoid buzzwords.');

    expect(screen.getByLabelText(/^tone$/i)).toHaveValue('warm and direct');
    expect(screen.getByLabelText(/voice/i)).toHaveValue('first-person');
    expect(screen.getByLabelText(/formality/i)).toHaveValue('formal');
    expect(screen.getByLabelText(/additional notes/i)).toHaveValue('Avoid buzzwords.');
  });

  it('preserves raw text after switching to structured and back to raw', async () => {
    const user = userEvent.setup();
    render(<App />);
    await goToWritingStyle(user);

    await user.selectOptions(screen.getByLabelText(/mode/i), 'raw');
    await user.type(screen.getByLabelText(/raw style guidance/i), 'Warm and encouraging.');

    await user.selectOptions(screen.getByLabelText(/mode/i), 'structured');
    expect(screen.getByLabelText(/^tone$/i)).toHaveValue('');

    await user.selectOptions(screen.getByLabelText(/mode/i), 'raw');
    expect(screen.getByLabelText(/raw style guidance/i)).toHaveValue('Warm and encouraging.');
  });

  it('continues to resume tailoring after specifying a style', async () => {
    const user = userEvent.setup();
    render(<App />);
    await goToWritingStyle(user);

    await user.selectOptions(screen.getByLabelText(/mode/i), 'raw');
    await user.type(screen.getByLabelText(/raw style guidance/i), 'Warm and encouraging.');

    await user.click(screen.getByRole('button', { name: 'Resume' }));
    expect(screen.getByRole('heading', { level: 2, name: /resume/i })).toBeInTheDocument();
  });
});
