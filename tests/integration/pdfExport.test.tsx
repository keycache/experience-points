import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../../src/app/App';

function buildResumeEnvelope() {
  return JSON.stringify({
    schema_version: '1.0',
    type: 'resume',
    data: {
      contact: { fullName: 'Jamie Rivera', email: 'jamie.rivera@example.com', otherLinks: [] },
      profileSummary: 'Platform engineer specializing in cloud infrastructure.',
      skills: ['Python', 'Terraform'],
      experience: [
        {
          id: 'res-exp-1',
          company: 'Initech',
          role: 'Senior Platform Engineer',
          startDate: { month: 3, year: 2021 },
          isCurrent: true,
          bullets: [{ id: 'b1', text: 'Led migration of Terraform stacks to OpenTofu.' }],
        },
      ],
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

describe('PDF export from Preview / Export (Stage 12)', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('generates and downloads a PDF without any LLM configuration or network request', async () => {
    // The PDF renderer's WASM-based text shaping engine resolves its module via
    // fetch() against an inline `data:` URI, which never touches the network. Only
    // real http(s) requests should be treated as a genuine (forbidden) network call.
    const originalFetch = globalThis.fetch;
    const requestedUrls: string[] = [];
    const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input.toString();
      requestedUrls.push(url);
      if (!url.startsWith('data:')) {
        throw new Error('Downloading the PDF must not perform a network request');
      }
      return originalFetch(input, init);
    });
    vi.stubGlobal('fetch', fetchMock);

    const createObjectURL = vi.fn<(blob: Blob) => string>(() => 'blob:mock-url');
    const revokeObjectURL = vi.fn();
    vi.stubGlobal('URL', { ...URL, createObjectURL, revokeObjectURL });
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: 'Resume' }));
    const file = new File([buildResumeEnvelope()], 'resume.json', { type: 'application/json' });
    await user.upload(screen.getByLabelText(/import resume file/i), file);
    await screen.findByLabelText('Full name');

    await user.click(screen.getByRole('button', { name: 'Preview / Export' }));
    await user.click(screen.getByRole('button', { name: /download pdf/i }));

    await waitFor(() => expect(createObjectURL).toHaveBeenCalledTimes(1));
    expect(await screen.findByRole('button', { name: /download pdf/i })).not.toBeDisabled();
    expect(createObjectURL.mock.calls[0][0]).toBeInstanceOf(Blob);
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(requestedUrls.every((url) => url.startsWith('data:'))).toBe(true);

    clickSpy.mockRestore();
  });

  it('shows a placeholder message when no resume exists yet', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: 'Preview / Export' }));

    expect(screen.getByText(/no resume yet/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /download pdf/i })).not.toBeInTheDocument();
  });
});
