import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../../src/app/App';

function mockFetchResponse(options: { ok: boolean; status: number; json: unknown }) {
  return vi.fn().mockResolvedValue({
    ok: options.ok,
    status: options.status,
    statusText: '',
    json: async () => options.json,
  });
}

async function enterValidLlmSettings(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: 'Configure' }));
  await user.type(screen.getByLabelText(/api key/i), 'sk-test-key');
  await user.type(screen.getByLabelText(/model/i), 'openai/gpt-4o');
}

describe('Test Connection UI (Stage 4)', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('shows a success message for a valid key/model', async () => {
    vi.stubGlobal(
      'fetch',
      mockFetchResponse({
        ok: true,
        status: 200,
        json: { choices: [{ message: { content: '{"status":"ok"}' } }] },
      }),
    );

    const user = userEvent.setup();
    render(<App />);
    await enterValidLlmSettings(user);

    await user.click(screen.getByRole('button', { name: /test connection/i }));

    expect(await screen.findByRole('status')).toHaveTextContent(/connection succeeded/i);
  });

  it('shows an authentication error, with Retry and Update API Key actions, for an invalid key', async () => {
    vi.stubGlobal(
      'fetch',
      mockFetchResponse({ ok: false, status: 401, json: { error: { message: 'Invalid API key' } } }),
    );

    const user = userEvent.setup();
    render(<App />);
    await enterValidLlmSettings(user);

    await user.click(screen.getByRole('button', { name: /test connection/i }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(/authentication failed/i);
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /update api key/i })).toBeInTheDocument();
  });

  it('retries the connection test when Retry is clicked', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: '',
        json: async () => ({ error: { message: 'Invalid API key' } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: '',
        json: async () => ({ choices: [{ message: { content: '{"status":"ok"}' } }] }),
      });
    vi.stubGlobal('fetch', fetchMock);

    const user = userEvent.setup();
    render(<App />);
    await enterValidLlmSettings(user);

    await user.click(screen.getByRole('button', { name: /test connection/i }));
    await screen.findByRole('alert');

    await user.click(screen.getByRole('button', { name: /retry/i }));

    expect(await screen.findByRole('status')).toHaveTextContent(/connection succeeded/i);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('moves focus to the API key field when Update API Key is clicked', async () => {
    vi.stubGlobal(
      'fetch',
      mockFetchResponse({ ok: false, status: 401, json: { error: { message: 'Invalid API key' } } }),
    );

    const user = userEvent.setup();
    render(<App />);
    await enterValidLlmSettings(user);

    await user.click(screen.getByRole('button', { name: /test connection/i }));
    await screen.findByRole('alert');

    await user.click(screen.getByRole('button', { name: /update api key/i }));

    await waitFor(() => {
      expect(screen.getByLabelText(/api key/i)).toHaveFocus();
    });
  });
});
