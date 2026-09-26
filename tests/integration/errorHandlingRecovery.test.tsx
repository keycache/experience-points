import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../../src/app/App';

/**
 * Stage 15: cross-cutting error handling and recovery assertions that
 * aren't already covered by each stage's own workflow tests (invalid
 * structured LLM responses already have per-step coverage in
 * careerProfileWorkflow/jobDescriptionWorkflow/matchTailorWorkflow/
 * resumeGenerationWorkflow tests; invalid import files and unsupported
 * schema versions already have coverage in importExport/importWorkflows
 * tests). This file specifically covers the NEW shared
 * `GenerationErrorAlert` behavior (plan.md Stage 15;
 * specification.md section 17):
 *
 * - Authentication failures get an "Update API Key" recovery action,
 *   from ANY generation step (not just the Configure step's own "Test
 *   Connection", which already had this before Stage 15).
 * - Network failures and provider errors get a useful message and
 *   Retry, without an irrelevant "Update API Key" action.
 * - No error message ever leaks the raw API key.
 * - PDF generation/download failures are retryable.
 * - Empty user input is explained, not just silently blocked.
 */

const API_KEY = 'sk-test-super-secret-key-value';

async function enterLlmSettings(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: 'Configure' }));
  await user.type(screen.getByLabelText(/api key/i), API_KEY);
  await user.type(screen.getByLabelText(/model/i), 'openai/gpt-4o');
}

function mockAuthFailureFetch() {
  return vi.fn().mockResolvedValue({
    ok: false,
    status: 401,
    statusText: '',
    json: async () => ({ error: { message: 'Invalid API key provided.' } }),
  });
}

describe('Error handling and recovery (Stage 15)', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('Career Profile generation: an authentication failure shows Retry and Update API Key, and never leaks the API key', async () => {
    vi.stubGlobal('fetch', mockAuthFailureFetch());

    const user = userEvent.setup();
    render(<App />);
    await enterLlmSettings(user);

    await user.click(screen.getByRole('button', { name: 'Career Profile' }));
    await user.type(screen.getByLabelText(/raw professional history/i), 'Some history.');
    await user.click(screen.getByRole('button', { name: /generate career profile/i }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(/authentication failed/i);
    expect(screen.getByRole('button', { name: /^retry$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /update api key/i })).toBeInTheDocument();
    expect(alert.textContent).not.toContain(API_KEY);
  });

  it('Update API Key (from a step other than Configure) navigates to Configure and focuses the API key field', async () => {
    vi.stubGlobal('fetch', mockAuthFailureFetch());

    const user = userEvent.setup();
    render(<App />);
    await enterLlmSettings(user);

    await user.click(screen.getByRole('button', { name: 'Career Profile' }));
    await user.type(screen.getByLabelText(/raw professional history/i), 'Some history.');
    await user.click(screen.getByRole('button', { name: /generate career profile/i }));
    await screen.findByRole('alert');

    await user.click(screen.getByRole('button', { name: /update api key/i }));

    expect(await screen.findByRole('heading', { level: 2, name: 'Configure' })).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByLabelText(/api key/i)).toHaveFocus();
    });
  });

  it('Job Description generation: a network failure shows a useful message and Retry, without an Update API Key action', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));
    vi.stubGlobal('fetch', fetchMock);

    const user = userEvent.setup();
    render(<App />);
    await enterLlmSettings(user);

    await user.click(screen.getByRole('button', { name: 'Job Description' }));
    await user.type(screen.getByLabelText(/raw job description/i), 'Some JD text.');
    await user.click(screen.getByRole('button', { name: /generate structured jd/i }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(/network|connection/i);
    expect(screen.getByRole('button', { name: /^retry$/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /update api key/i })).not.toBeInTheDocument();
  });

  it('Match & Tailor: a provider outage (500) shows a useful message and Retry', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      json: async () => ({ error: { message: 'The model provider is temporarily unavailable.' } }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const user = userEvent.setup();
    render(<App />);
    await enterLlmSettings(user);

    await user.click(screen.getByRole('button', { name: 'Career Profile' }));
    await user.upload(
      screen.getByLabelText(/import career profile file/i),
      new File(
        [
          JSON.stringify({
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
          }),
        ],
        'career-profile.json',
        { type: 'application/json' },
      ),
    );
    await screen.findByLabelText('Full name');

    await user.click(screen.getByRole('button', { name: 'Job Description' }));
    await user.upload(
      screen.getByLabelText(/import job description file/i),
      new File(
        [
          JSON.stringify({
            schema_version: '1.0',
            type: 'job-description',
            data: {
              metadata: { title: 'Engineer' },
              summary: 'Summary.',
              responsibilities: [],
              requirements: [],
              preferredQualifications: [],
              technologies: [],
              leadershipExpectations: [],
              domainSignals: [],
              otherSignals: [],
            },
          }),
        ],
        'job-description.json',
        { type: 'application/json' },
      ),
    );
    await screen.findByLabelText('Title');

    await user.click(screen.getByRole('button', { name: 'Match & Tailor' }));
    await user.click(screen.getByRole('button', { name: /generate matching analysis/i }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(/temporarily unavailable|request failed/i);
    expect(screen.getByRole('button', { name: /^retry$/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /update api key/i })).not.toBeInTheDocument();
  });

  it('Preview / Export: a PDF download failure shows a message and can be retried', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: 'Resume' }));
    await user.upload(
      screen.getByLabelText(/import resume file/i),
      new File(
        [
          JSON.stringify({
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
          }),
        ],
        'resume.json',
        { type: 'application/json' },
      ),
    );
    await screen.findByLabelText('Full name');

    await user.click(screen.getByRole('button', { name: 'Preview / Export' }));

    const failingCreateObjectURL = vi.fn(() => {
      throw new Error('Could not create an object URL for the PDF.');
    });
    vi.stubGlobal('URL', { ...URL, createObjectURL: failingCreateObjectURL, revokeObjectURL: vi.fn() });

    await user.click(screen.getByRole('button', { name: /download pdf/i }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(/could not create an object url for the pdf/i);

    const workingCreateObjectURL = vi.fn(() => 'blob:mock-url');
    vi.stubGlobal('URL', { ...URL, createObjectURL: workingCreateObjectURL, revokeObjectURL: vi.fn() });
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    await user.click(screen.getByRole('button', { name: /retry/i }));

    await waitFor(() => expect(workingCreateObjectURL).toHaveBeenCalledTimes(1));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();

    clickSpy.mockRestore();
  });

  it('Career Profile: explains what is needed when there is no input yet, and keeps Generate disabled', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: 'Career Profile' }));

    expect(screen.getByRole('button', { name: /generate career profile/i })).toBeDisabled();
    expect(screen.getByText(/paste some raw information above and generate one/i)).toBeInTheDocument();
  });
});
