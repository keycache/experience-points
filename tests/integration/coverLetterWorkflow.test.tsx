import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../../src/app/App';
import { CoverLetterSchema } from '../../src/schemas/coverLetter';

function mockFetchOnce(content: string, options: { ok?: boolean; status?: number } = {}) {
  return {
    ok: options.ok ?? true,
    status: options.status ?? 200,
    statusText: '',
    json: async () => ({ choices: [{ message: { content } }] }),
  };
}

function buildCareerProfileEnvelope() {
  return JSON.stringify({
    schema_version: '1.0',
    type: 'career-profile',
    data: {
      personal: { fullName: 'Jamie Rivera', otherLinks: [] },
      experience: [
        {
          id: 'exp-current',
          company: 'Initech',
          role: 'Senior Platform Engineer',
          startDate: { month: 3, year: 2021 },
          isCurrent: true,
          projects: [],
          technologies: ['Python', 'OpenTofu', 'AWS'],
        },
      ],
      skills: [{ id: 'skill-1', name: 'Python' }],
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
}

function buildJobDescriptionEnvelope() {
  return JSON.stringify({
    schema_version: '1.0',
    type: 'job-description',
    data: {
      metadata: { title: 'Senior Platform Engineer', company: 'Hooli', location: 'Remote' },
      summary: 'Own our cloud infrastructure.',
      responsibilities: [],
      requirements: ['5+ years with Terraform'],
      preferredQualifications: [],
      technologies: ['Python', 'Terraform', 'AWS'],
      leadershipExpectations: [],
      domainSignals: [],
      otherSignals: [],
    },
  });
}

function buildMatchingAnalysisResponse() {
  return JSON.stringify({
    importantRequirements: ['5+ years with Terraform'],
    relevantExperienceIds: ['exp-current'],
    importantTechnologies: ['Python', 'Terraform', 'AWS'],
    equivalentTechnologies: [
      { jdTechnology: 'Terraform', profileTechnology: 'OpenTofu', rationale: 'Same HCL API' },
    ],
    missingEvidence: ['Kubernetes'],
    suggestedOrdering: ['exp-current'],
    suggestedSkills: ['Python', 'Terraform'],
  });
}

function buildResumeResponse() {
  return JSON.stringify({
    contact: { fullName: 'Jamie Rivera', email: 'jamie.rivera@example.com', otherLinks: [] },
    profileSummary: 'Platform engineer tailored for the Hooli Senior Platform Engineer role.',
    skills: ['Terraform', 'Python', 'AWS'],
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
  });
}

function buildCoverLetterResponse(overrides: Record<string, unknown> = {}) {
  return JSON.stringify({
    salutation: 'Dear Hiring Manager,',
    bodyParagraphs: [
      'I am excited to apply for the Senior Platform Engineer role at Hooli.',
      'At Initech, I led the migration of Terraform stacks to OpenTofu, directly relevant to your infrastructure needs.',
      'I would welcome the opportunity to discuss how I can contribute to your team.',
    ],
    closing: 'Sincerely,',
    senderContact: { fullName: 'Jamie Rivera', email: 'jamie.rivera@example.com', otherLinks: [] },
    ...overrides,
  });
}

async function seedThroughResume(user: ReturnType<typeof userEvent.setup>, fetchMock: ReturnType<typeof vi.fn>) {
  await user.click(screen.getByRole('button', { name: 'Configure' }));
  await user.type(screen.getByLabelText(/api key/i), 'sk-test-key');
  await user.type(screen.getByLabelText(/model/i), 'openai/gpt-4o');

  await user.click(screen.getByRole('button', { name: 'Career Profile' }));
  const careerProfileFile = new File([buildCareerProfileEnvelope()], 'career-profile.json', {
    type: 'application/json',
  });
  await user.upload(screen.getByLabelText(/import career profile file/i), careerProfileFile);
  await screen.findByLabelText('Full name');

  await user.click(screen.getByRole('button', { name: 'Job Description' }));
  const jdFile = new File([buildJobDescriptionEnvelope()], 'job-description.json', {
    type: 'application/json',
  });
  await user.upload(screen.getByLabelText(/import job description file/i), jdFile);
  await screen.findByLabelText('Title');

  await user.click(screen.getByRole('button', { name: 'Match & Tailor' }));
  fetchMock.mockResolvedValueOnce(mockFetchOnce(buildMatchingAnalysisResponse()));
  await user.click(screen.getByRole('button', { name: /generate matching analysis/i }));
  await screen.findByLabelText('Best Match');

  await user.click(screen.getByRole('button', { name: 'Resume' }));
  fetchMock.mockResolvedValueOnce(mockFetchOnce(buildResumeResponse()));
  await user.click(screen.getByRole('button', { name: /generate resume/i }));
  await screen.findByDisplayValue(/platform engineer tailored for the hooli/i);
}

describe('Cover Letter workflow (Stage 14.5)', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('shows a placeholder and disables generation before a Resume exists', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: 'Cover Letter' }));

    expect(screen.getByText(/no cover letter yet/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /generate cover letter/i })).toBeDisabled();
  });

  it('generates using a supplied Writing Style', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: 'Configure' }));
    await user.type(screen.getByLabelText(/api key/i), 'sk-test-key');
    await user.type(screen.getByLabelText(/model/i), 'openai/gpt-4o');

    await user.click(screen.getByRole('button', { name: 'Career Profile' }));
    await user.upload(
      screen.getByLabelText(/import career profile file/i),
      new File([buildCareerProfileEnvelope()], 'career-profile.json', { type: 'application/json' }),
    );
    await screen.findByLabelText('Full name');

    await user.click(screen.getByRole('button', { name: 'Job Description' }));
    await user.upload(
      screen.getByLabelText(/import job description file/i),
      new File([buildJobDescriptionEnvelope()], 'job-description.json', { type: 'application/json' }),
    );
    await screen.findByLabelText('Title');

    await user.click(screen.getByRole('button', { name: 'Writing Style' }));
    await user.selectOptions(screen.getByLabelText(/mode/i), 'raw');
    await user.type(screen.getByLabelText(/raw style guidance/i), 'Write in a bold, energetic voice.');

    await user.click(screen.getByRole('button', { name: 'Match & Tailor' }));
    fetchMock.mockResolvedValueOnce(mockFetchOnce(buildMatchingAnalysisResponse()));
    await user.click(screen.getByRole('button', { name: /generate matching analysis/i }));
    await screen.findByLabelText('Best Match');

    await user.click(screen.getByRole('button', { name: 'Resume' }));
    fetchMock.mockResolvedValueOnce(mockFetchOnce(buildResumeResponse()));
    await user.click(screen.getByRole('button', { name: /generate resume/i }));
    await screen.findByDisplayValue(/platform engineer tailored for the hooli/i);

    await user.click(screen.getByRole('button', { name: 'Cover Letter' }));
    fetchMock.mockResolvedValueOnce(mockFetchOnce(buildCoverLetterResponse()));
    await user.click(screen.getByRole('button', { name: /generate cover letter/i }));
    await screen.findByLabelText('Salutation');

    const [, requestInit] = fetchMock.mock.calls[fetchMock.mock.calls.length - 1];
    const body = JSON.parse(requestInit.body);
    const combined = body.messages[1].content.map((part: { text?: string }) => part.text ?? '').join('\n');
    expect(combined).toContain('Write in a bold, energetic voice.');
  });

  it('generates with no Writing Style, extrapolating one instead', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const user = userEvent.setup();
    render(<App />);
    await seedThroughResume(user, fetchMock);

    await user.click(screen.getByRole('button', { name: 'Cover Letter' }));
    fetchMock.mockResolvedValueOnce(mockFetchOnce(buildCoverLetterResponse()));
    await user.click(screen.getByRole('button', { name: /generate cover letter/i }));
    await screen.findByLabelText('Salutation');

    const [, requestInit] = fetchMock.mock.calls[fetchMock.mock.calls.length - 1];
    const body = JSON.parse(requestInit.body);
    const combined = body.messages[1].content.map((part: { text?: string }) => part.text ?? '').join('\n');
    expect(combined).toContain('No explicit writing style was provided');
  });

  it('rejects invalid LLM output and allows retry after fixing it', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const user = userEvent.setup();
    render(<App />);
    await seedThroughResume(user, fetchMock);

    await user.click(screen.getByRole('button', { name: 'Cover Letter' }));
    fetchMock.mockResolvedValueOnce(mockFetchOnce('this is not valid json'));
    await user.click(screen.getByRole('button', { name: /generate cover letter/i }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(/did not match|not valid json|failed/i);

    fetchMock.mockResolvedValueOnce(mockFetchOnce(buildCoverLetterResponse()));
    await user.click(within(alert).getByRole('button', { name: /retry/i }));

    expect(await screen.findByLabelText('Salutation')).toHaveValue('Dear Hiring Manager,');
  });

  it('supports manual editing of a generated Cover Letter', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const user = userEvent.setup();
    render(<App />);
    await seedThroughResume(user, fetchMock);

    await user.click(screen.getByRole('button', { name: 'Cover Letter' }));
    fetchMock.mockResolvedValueOnce(mockFetchOnce(buildCoverLetterResponse()));
    await user.click(screen.getByRole('button', { name: /generate cover letter/i }));
    await screen.findByLabelText('Salutation');

    const salutation = screen.getByLabelText('Salutation');
    await user.clear(salutation);
    await user.type(salutation, 'Dear Ms. Swift,');
    expect(salutation).toHaveValue('Dear Ms. Swift,');

    const firstParagraphGroup = screen.getByRole('group', { name: 'Paragraph 1' });
    const firstParagraph = within(firstParagraphGroup).getByLabelText('Paragraph 1');
    await user.clear(firstParagraph);
    await user.type(firstParagraph, 'Edited opening paragraph.');
    expect(firstParagraph).toHaveValue('Edited opening paragraph.');
  });

  it('exports the Cover Letter as JSON and the edits survive a re-import round trip', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const user = userEvent.setup();
    render(<App />);
    await seedThroughResume(user, fetchMock);

    await user.click(screen.getByRole('button', { name: 'Cover Letter' }));
    fetchMock.mockResolvedValueOnce(mockFetchOnce(buildCoverLetterResponse()));
    await user.click(screen.getByRole('button', { name: /generate cover letter/i }));
    await screen.findByLabelText('Salutation');

    const salutation = screen.getByLabelText('Salutation');
    await user.clear(salutation);
    await user.type(salutation, 'Dear Ms. Swift,');

    let capturedBlobText = '';
    const originalBlob = globalThis.Blob;
    class CapturingBlob extends originalBlob {
      constructor(parts: BlobPart[], options?: BlobPropertyBag) {
        super(parts, options);
        capturedBlobText = parts.join('');
      }
    }
    vi.stubGlobal('Blob', CapturingBlob);
    const createObjectURL = vi.fn(() => 'blob:mock-url');
    vi.stubGlobal('URL', { ...URL, createObjectURL, revokeObjectURL: vi.fn() });
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    await user.click(screen.getByRole('button', { name: /download cover letter json/i }));

    const envelope = JSON.parse(capturedBlobText);
    expect(envelope.type).toBe('cover-letter');
    expect(CoverLetterSchema.safeParse(envelope.data).success).toBe(true);
    expect(envelope.data.salutation).toBe('Dear Ms. Swift,');

    const file = new File([capturedBlobText], 'cover-letter.json', { type: 'application/json' });
    await user.upload(screen.getByLabelText(/import cover letter file/i), file);

    expect(await screen.findByLabelText('Salutation')).toHaveValue('Dear Ms. Swift,');
  });

  it('offers a "Download Cover Letter PDF" button in Preview / Export once a Cover Letter exists, and exporting it makes no network request', async () => {
    // As with the Resume PDF renderer (plan.md Stage 12), the WASM-based
    // text shaping engine resolves its module via fetch() against an
    // inline `data:` URI -- never a real network request.
    const originalFetch = globalThis.fetch;
    const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit): Promise<unknown> => {
      const url = typeof input === 'string' ? input : input.toString();
      if (url.startsWith('data:')) {
        return originalFetch(input, init);
      }
      throw new Error(`Unexpected network request to ${url}`);
    });
    vi.stubGlobal('fetch', fetchMock);
    const createObjectURL = vi.fn<(blob: Blob) => string>(() => 'blob:mock-url');
    vi.stubGlobal('URL', { ...URL, createObjectURL, revokeObjectURL: vi.fn() });
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    const user = userEvent.setup();
    render(<App />);

    const resumeEnvelope = JSON.stringify({
      schema_version: '1.0',
      type: 'resume',
      data: JSON.parse(buildResumeResponse()),
    });
    await user.click(screen.getByRole('button', { name: 'Resume' }));
    await user.upload(
      screen.getByLabelText(/import resume file/i),
      new File([resumeEnvelope], 'resume.json', { type: 'application/json' }),
    );
    await screen.findByLabelText('Full name');

    const coverLetterEnvelope = JSON.stringify({
      schema_version: '1.0',
      type: 'cover-letter',
      data: JSON.parse(buildCoverLetterResponse()),
    });
    await user.click(screen.getByRole('button', { name: 'Cover Letter' }));
    await user.upload(
      screen.getByLabelText(/import cover letter file/i),
      new File([coverLetterEnvelope], 'cover-letter.json', { type: 'application/json' }),
    );
    await screen.findByLabelText('Salutation');

    await user.click(screen.getByRole('button', { name: 'Preview / Export' }));
    const downloadCoverLetterButton = await screen.findByRole('button', {
      name: /download cover letter pdf/i,
    });
    await user.click(downloadCoverLetterButton);

    await waitFor(() => expect(createObjectURL).toHaveBeenCalledTimes(1));
    expect(createObjectURL.mock.calls[0][0]).toBeInstanceOf(Blob);
    expect(clickSpy).toHaveBeenCalledTimes(1);

    clickSpy.mockRestore();
  });
});
