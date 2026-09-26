import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../../src/app/App';

const TEST_API_KEY = 'sk-test-secret-12345';
const TEST_MODEL = 'openai/gpt-4o';

async function enterLlmSettings(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: 'Configure' }));
  await user.type(screen.getByLabelText(/api key/i), TEST_API_KEY);
  await user.type(screen.getByLabelText(/model/i), TEST_MODEL);
}

describe('Session state and privacy boundary', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('keeps the entered API key in application state', async () => {
    const user = userEvent.setup();
    render(<App />);

    await enterLlmSettings(user);

    expect(screen.getByLabelText(/api key/i)).toHaveValue(TEST_API_KEY);
  });

  it('never writes the API key to localStorage', async () => {
    const user = userEvent.setup();
    render(<App />);

    await enterLlmSettings(user);

    expect(localStorage.length).toBe(0);
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i)!;
      expect(localStorage.getItem(key)).not.toContain(TEST_API_KEY);
    }
  });

  it('never writes the API key to sessionStorage', async () => {
    const user = userEvent.setup();
    render(<App />);

    await enterLlmSettings(user);

    expect(sessionStorage.length).toBe(0);
    for (let i = 0; i < sessionStorage.length; i += 1) {
      const key = sessionStorage.key(i)!;
      expect(sessionStorage.getItem(key)).not.toContain(TEST_API_KEY);
    }
  });

  it('never writes the API key to cookies', async () => {
    const user = userEvent.setup();
    render(<App />);

    await enterLlmSettings(user);

    expect(document.cookie).not.toContain(TEST_API_KEY);
  });

  it('never places the API key in the URL', async () => {
    const user = userEvent.setup();
    render(<App />);

    await enterLlmSettings(user);

    expect(window.location.href).not.toContain(TEST_API_KEY);
    expect(window.location.search).not.toContain(TEST_API_KEY);
    expect(window.location.hash).not.toContain(TEST_API_KEY);
  });

  it('removes the API key from application state when the session is cleared', async () => {
    const user = userEvent.setup();
    render(<App />);

    await enterLlmSettings(user);
    expect(screen.getByLabelText(/api key/i)).toHaveValue(TEST_API_KEY);

    await user.click(screen.getByRole('button', { name: /clear session/i }));

    expect(screen.getByLabelText(/api key/i)).toHaveValue('');
  });

  it('does not emit the API key through application logging', async () => {
    const logSpies = (['log', 'warn', 'error', 'info', 'debug'] as const).map((method) =>
      vi.spyOn(console, method).mockImplementation(() => {}),
    );

    const user = userEvent.setup();
    render(<App />);
    await enterLlmSettings(user);
    await user.click(screen.getByRole('button', { name: /clear session/i }));

    for (const spy of logSpies) {
      for (const call of spy.mock.calls) {
        const serialized = call.map((arg) => String(arg)).join(' ');
        expect(serialized).not.toContain(TEST_API_KEY);
      }
      spy.mockRestore();
    }
  });

  it('shows the privacy notice on the Configure step', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: 'Configure' }));

    expect(
      screen.getByText(/your information is processed in this browser session/i),
    ).toBeInTheDocument();
  });
});
