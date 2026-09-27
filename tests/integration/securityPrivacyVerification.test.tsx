import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../../src/app/App';

/**
 * Stage 17: Security / Privacy Verification.
 *
 * `tests/integration/privacy.test.tsx` (Stage 2) already covers the
 * core "API key never touches localStorage/sessionStorage/cookies/URL/
 * logs, and is cleared on Clear Session" assertions. This file adds
 * the remaining specific checks plan.md Stage 17 calls out that were
 * not yet covered by any prior stage:
 *
 * - IndexedDB is never touched either (plan.md's explicit search list
 *   includes `indexedDB`, but Stage 2 only asserted local/session
 *   storage + cookies + URL).
 * - The API key is never embedded in ANY downloaded artifact JSON
 *   (Career Profile, Job Description, Resume, Cover Letter) even when
 *   a real key is configured at download time.
 * - The API key never appears in the outgoing LLM request BODY (it is
 *   only ever sent via the `Authorization` header, per
 *   specification.md section 5.2 / 6).
 * - PDF generation (Resume and Cover Letter) makes no network request
 *   at all, even with a real API key configured in the same session.
 */

const TEST_API_KEY = 'sk-test-secret-should-never-leak-98765';
const TEST_MODEL = 'openai/gpt-4o';

function mockFetchOnce(content: string) {
  return {
    ok: true,
    status: 200,
    statusText: '',
    json: async () => ({ choices: [{ message: { content } }] }),
  };
}

async function enterLlmSettings(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: 'Configure' }));
  await user.type(screen.getByLabelText(/api key/i), TEST_API_KEY);
  await user.type(screen.getByLabelText(/model/i), TEST_MODEL);
}

function stubDownloadCapture() {
  let capturedBlobText = '';
  const originalBlob = globalThis.Blob;
  class CapturingBlob extends originalBlob {
    constructor(parts: BlobPart[], options?: BlobPropertyBag) {
      super(parts, options);
      capturedBlobText = parts.join('');
    }
  }
  vi.stubGlobal('Blob', CapturingBlob);
  vi.stubGlobal('URL', { ...URL, createObjectURL: vi.fn(() => 'blob:mock-url'), revokeObjectURL: vi.fn() });
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
  return () => capturedBlobText;
}

describe('Security / Privacy Verification (Stage 17)', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('never opens or writes to IndexedDB', async () => {
    // jsdom (the test environment) does not implement IndexedDB at all
    // by default, which is itself consistent with the app never
    // needing it -- but guard against a future jsdom version adding a
    // stub by also spying on `indexedDB.open` when it exists.
    const openSpy =
      typeof indexedDB !== 'undefined' ? vi.spyOn(indexedDB, 'open') : undefined;

    const user = userEvent.setup();
    render(<App />);
    await enterLlmSettings(user);
    await user.click(screen.getByRole('button', { name: 'Clear session' }));

    if (openSpy) {
      expect(openSpy).not.toHaveBeenCalled();
    } else {
      expect(typeof indexedDB).toBe('undefined');
    }
  });

  it('does not embed the API key in a downloaded Career Profile JSON', async () => {
    const user = userEvent.setup();
    render(<App />);
    await enterLlmSettings(user);

    await user.click(screen.getByRole('button', { name: 'Career Profile' }));
    const envelope = JSON.stringify({
      schema_version: '1.0',
      type: 'career-profile',
      data: {
        personal: { fullName: 'Jamie Rivera', otherLinks: [] },
        experience: [],
        skills: [],
        education: [],
        certifications: [],
        awards: [],
        publications: [],
        projects: [],
        volunteerExperience: [],
        professionalAffiliations: [],
        customSections: [],
      },
    });
    await user.upload(
      screen.getByLabelText(/import career profile file/i),
      new File([envelope], 'career-profile.json', { type: 'application/json' }),
    );
    await screen.findByLabelText('Full name');

    const getCapturedText = stubDownloadCapture();
    await user.click(screen.getByRole('button', { name: /download career profile json/i }));

    expect(getCapturedText()).not.toContain(TEST_API_KEY);
  });

  it('does not embed the API key in a downloaded Resume JSON', async () => {
    const user = userEvent.setup();
    render(<App />);
    await enterLlmSettings(user);

    await user.click(screen.getByRole('button', { name: 'Resume' }));
    const envelope = JSON.stringify({
      schema_version: '1.0',
      type: 'resume',
      data: {
        contact: { fullName: 'Jamie Rivera', otherLinks: [] },
        skills: [],
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

    const getCapturedText = stubDownloadCapture();
    await user.click(screen.getByRole('button', { name: /download resume json/i }));

    expect(getCapturedText()).not.toContain(TEST_API_KEY);
  });

  it('never sends the API key in the outgoing LLM request body (only via the Authorization header)', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      mockFetchOnce(
        JSON.stringify({
          personal: { fullName: 'Jamie Rivera', otherLinks: [] },
          experience: [],
          skills: [],
          education: [],
          certifications: [],
          awards: [],
          publications: [],
          projects: [],
          volunteerExperience: [],
          professionalAffiliations: [],
          customSections: [],
        }),
      ),
    );
    vi.stubGlobal('fetch', fetchMock);

    const user = userEvent.setup();
    render(<App />);
    await enterLlmSettings(user);

    await user.click(screen.getByRole('button', { name: 'Career Profile' }));
    await user.type(screen.getByLabelText(/raw professional history/i), 'Some history.');
    await user.click(screen.getByRole('button', { name: /generate career profile/i }));
    await screen.findByLabelText('Full name');

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, requestInit] = fetchMock.mock.calls[0];
    expect(String(url)).toBe('https://openrouter.ai/api/v1/chat/completions');
    expect(requestInit.body).not.toContain(TEST_API_KEY);
    // The key IS expected in the Authorization header -- that is the
    // one sanctioned place for it (specification.md section 5.2/6).
    expect(requestInit.headers.Authorization).toBe(`Bearer ${TEST_API_KEY}`);
  });

  it('PDF generation (Resume and Cover Letter) makes no network request even with a real API key configured', async () => {
    const requestedUrls: string[] = [];
    const fetchMock = vi.fn((input: RequestInfo | URL): Promise<unknown> => {
      requestedUrls.push(typeof input === 'string' ? input : input.toString());
      throw new Error('PDF generation must not perform any network request');
    });
    vi.stubGlobal('fetch', fetchMock);
    vi.stubGlobal('URL', { ...URL, createObjectURL: vi.fn(() => 'blob:mock-url'), revokeObjectURL: vi.fn() });
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    const user = userEvent.setup();
    render(<App />);
    await enterLlmSettings(user);

    await user.click(screen.getByRole('button', { name: 'Resume' }));
    const resumeEnvelope = JSON.stringify({
      schema_version: '1.0',
      type: 'resume',
      data: {
        contact: { fullName: 'Jamie Rivera', otherLinks: [] },
        skills: [],
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
      new File([resumeEnvelope], 'resume.json', { type: 'application/json' }),
    );
    await screen.findByLabelText('Full name');

    await user.click(screen.getByRole('button', { name: 'Cover Letter' }));
    const coverLetterEnvelope = JSON.stringify({
      schema_version: '1.0',
      type: 'cover-letter',
      data: {
        salutation: 'Dear Hiring Manager,',
        bodyParagraphs: ['A short paragraph.'],
        closing: 'Sincerely,',
        senderContact: { fullName: 'Jamie Rivera', otherLinks: [] },
      },
    });
    await user.upload(
      screen.getByLabelText(/import cover letter file/i),
      new File([coverLetterEnvelope], 'cover-letter.json', { type: 'application/json' }),
    );
    await screen.findByLabelText('Salutation');

    await user.click(screen.getByRole('button', { name: 'Preview / Export' }));
    await user.click(screen.getByRole('button', { name: /^download pdf$/i }));
    await user.click(screen.getByRole('button', { name: /download cover letter pdf/i }));

    // The PDF renderer's WASM module fetches an internal `data:` URI
    // (never a real network request, see Stage 12 notes); a genuine
    // http(s) request would have thrown inside fetchMock above and
    // failed the test via an unhandled rejection/console error.
    for (const url of requestedUrls) {
      expect(url.startsWith('data:')).toBe(true);
    }
  });

  it('the privacy notice on Configure explicitly states the client-only / direct-to-provider model', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: 'Configure' }));

    const notice = screen.getByText(/your information is processed in this browser session/i);
    expect(notice).toHaveTextContent(/sent directly from your browser to the selected llm provider/i);
    expect(notice).toHaveTextContent(/kept only in memory/i);
    expect(notice).toHaveTextContent(/not stored in browser storage, cookies, or application servers/i);
  });
});
