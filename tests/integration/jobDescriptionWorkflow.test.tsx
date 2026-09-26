import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../../src/app/App';

function mockFetchOnce(content: string, options: { ok?: boolean; status?: number } = {}) {
  return {
    ok: options.ok ?? true,
    status: options.status ?? 200,
    statusText: '',
    json: async () => ({ choices: [{ message: { content } }] }),
  };
}

function buildJobDescriptionResponse(overrides: Record<string, unknown> = {}) {
  return JSON.stringify({
    metadata: { title: 'Senior Platform Engineer', company: 'Hooli', location: 'Remote' },
    summary: 'Own our cloud infrastructure and CI/CD platform.',
    responsibilities: ['Design and operate Kubernetes clusters'],
    requirements: ['5+ years with Terraform'],
    preferredQualifications: [],
    technologies: ['Python', 'Terraform', 'AWS'],
    leadershipExpectations: [],
    domainSignals: [],
    otherSignals: [],
    ...overrides,
  });
}

async function goToConfigureAndEnterSettings(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: 'Configure' }));
  await user.type(screen.getByLabelText(/api key/i), 'sk-test-key');
  await user.type(screen.getByLabelText(/model/i), 'openai/gpt-4o');
}

async function goToJobDescription(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: 'Job Description' }));
}

describe('Job Description workflow (Stage 6)', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('extracts a structured JD from raw text', async () => {
    const fetchMock = vi.fn().mockResolvedValue(mockFetchOnce(buildJobDescriptionResponse()));
    vi.stubGlobal('fetch', fetchMock);

    const user = userEvent.setup();
    render(<App />);
    await goToConfigureAndEnterSettings(user);
    await goToJobDescription(user);

    await user.type(
      screen.getByLabelText(/raw job description/i),
      'Senior Platform Engineer at Hooli, remote. Requires 5+ years with Terraform.',
    );
    await user.click(screen.getByRole('button', { name: /generate structured jd/i }));

    expect(await screen.findByLabelText('Title')).toHaveValue('Senior Platform Engineer');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('extracts a structured JD from a single image', async () => {
    const fetchMock = vi.fn().mockResolvedValue(mockFetchOnce(buildJobDescriptionResponse()));
    vi.stubGlobal('fetch', fetchMock);

    const user = userEvent.setup();
    render(<App />);
    await goToConfigureAndEnterSettings(user);
    await goToJobDescription(user);

    const image = new File(['fake-image-bytes'], 'jd-screenshot.png', { type: 'image/png' });
    await user.upload(screen.getByLabelText(/images \(e\.g\. jd screenshots\)/i), image);
    expect(await screen.findByText('jd-screenshot.png')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /generate structured jd/i }));
    await screen.findByLabelText('Title');

    const [, requestInit] = fetchMock.mock.calls[0];
    const body = JSON.parse(requestInit.body);
    const imageParts = body.messages[1].content.filter((part: { type: string }) => part.type === 'image_url');
    expect(imageParts).toHaveLength(1);
  });

  it('extracts a structured JD from multiple images', async () => {
    const fetchMock = vi.fn().mockResolvedValue(mockFetchOnce(buildJobDescriptionResponse()));
    vi.stubGlobal('fetch', fetchMock);

    const user = userEvent.setup();
    render(<App />);
    await goToConfigureAndEnterSettings(user);
    await goToJobDescription(user);

    const images = [
      new File(['a'], 'jd-page-1.png', { type: 'image/png' }),
      new File(['b'], 'jd-page-2.png', { type: 'image/png' }),
    ];
    await user.upload(screen.getByLabelText(/images \(e\.g\. jd screenshots\)/i), images);
    expect(await screen.findByText('jd-page-1.png')).toBeInTheDocument();
    expect(await screen.findByText('jd-page-2.png')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /generate structured jd/i }));
    await screen.findByLabelText('Title');

    const [, requestInit] = fetchMock.mock.calls[0];
    const body = JSON.parse(requestInit.body);
    const imageParts = body.messages[1].content.filter((part: { type: string }) => part.type === 'image_url');
    expect(imageParts).toHaveLength(2);
  });

  it('importing a valid structured JD file does not call the extraction LLM', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const user = userEvent.setup();
    render(<App />);
    await goToConfigureAndEnterSettings(user);
    await goToJobDescription(user);

    const json = JSON.stringify({
      schema_version: '1.0',
      type: 'job-description',
      data: JSON.parse(buildJobDescriptionResponse()),
    });
    const file = new File([json], 'job-description.json', { type: 'application/json' });

    await user.upload(screen.getByLabelText(/import job description file/i), file);

    expect(await screen.findByLabelText('Title')).toHaveValue('Senior Platform Engineer');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects an invalid JD JSON file with a readable error', async () => {
    vi.stubGlobal('fetch', vi.fn());

    const user = userEvent.setup();
    render(<App />);
    await goToConfigureAndEnterSettings(user);
    await goToJobDescription(user);

    const invalidJson = JSON.stringify({
      schema_version: '1.0',
      type: 'job-description',
      data: { metadata: {} },
    });
    const file = new File([invalidJson], 'job-description.json', { type: 'application/json' });

    await user.upload(screen.getByLabelText(/import job description file/i), file);

    expect(await screen.findByRole('alert')).toHaveTextContent(/does not match the expected schema/i);
  });

  it('supports manual editing of a requirement', async () => {
    const fetchMock = vi.fn().mockResolvedValue(mockFetchOnce(buildJobDescriptionResponse()));
    vi.stubGlobal('fetch', fetchMock);

    const user = userEvent.setup();
    render(<App />);
    await goToConfigureAndEnterSettings(user);
    await goToJobDescription(user);

    await user.type(screen.getByLabelText(/raw job description/i), 'Some JD text.');
    await user.click(screen.getByRole('button', { name: /generate structured jd/i }));
    await screen.findByLabelText('Title');

    const requirementGroup = screen.getByRole('group', { name: 'Requirement 1' });
    const requirementInput = within(requirementGroup).getByLabelText('Requirement 1');
    await user.clear(requirementInput);
    await user.type(requirementInput, '7+ years with Terraform and OpenTofu');

    expect(requirementInput).toHaveValue('7+ years with Terraform and OpenTofu');
  });

  it('exports and re-imports a structured JD (round trip)', async () => {
    const fetchMock = vi.fn().mockResolvedValue(mockFetchOnce(buildJobDescriptionResponse()));
    vi.stubGlobal('fetch', fetchMock);
    const createObjectURL = vi.fn(() => 'blob:mock-url');
    const revokeObjectURL = vi.fn();
    vi.stubGlobal('URL', { ...URL, createObjectURL, revokeObjectURL });
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    const user = userEvent.setup();
    render(<App />);
    await goToConfigureAndEnterSettings(user);
    await goToJobDescription(user);

    await user.type(screen.getByLabelText(/raw job description/i), 'Some JD text.');
    await user.click(screen.getByRole('button', { name: /generate structured jd/i }));
    await screen.findByLabelText('Title');

    await user.click(screen.getByRole('button', { name: /download job description json/i }));

    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(clickSpy).toHaveBeenCalledTimes(1);

    // Round trip: import the same structured JD back in without calling the LLM again.
    fetchMock.mockClear();
    const roundTripJson = JSON.stringify({
      schema_version: '1.0',
      type: 'job-description',
      data: JSON.parse(buildJobDescriptionResponse()),
    });
    const file = new File([roundTripJson], 'job-description.json', { type: 'application/json' });
    await user.upload(screen.getByLabelText(/import job description file/i), file);

    expect(await screen.findByLabelText('Title')).toHaveValue('Senior Platform Engineer');
    expect(fetchMock).not.toHaveBeenCalled();

    clickSpy.mockRestore();
  });
});
