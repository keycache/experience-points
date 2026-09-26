import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../../src/app/App';

/**
 * Stage 14: validates the two "shortcut" workflows described in
 * plan.md:
 *
 * Workflow A: Career Profile JSON + JD JSON -> Matching -> Resume -> PDF
 * Workflow B: Resume JSON -> Edit -> Preview -> PDF (no LLM required)
 *
 * Career Profile and Job Description import already have per-field
 * component tests (Stages 5/6); Resume import/edit/PDF export already
 * have per-feature tests (Stages 10/12). This file adds the
 * cross-cutting assertions plan.md calls out specifically for Stage
 * 14: that importing an artifact truly *bypasses* the corresponding
 * LLM call (not just that the imported data appears), that invalid
 * files are rejected via the real step UI (not just the dev
 * playground), and that both shortcut workflows work end-to-end in a
 * single session.
 */

function mockFetchOnce(content: string, options: { ok?: boolean; status?: number } = {}) {
  return {
    ok: options.ok ?? true,
    status: options.status ?? 200,
    statusText: '',
    json: async () => ({ choices: [{ message: { content } }] }),
  };
}

/**
 * `@react-pdf/renderer`'s WASM-based text-shaping engine resolves its
 * module via `fetch()` against an inline `data:` URI on first use in a
 * test process. That is never a real network call (no DNS/socket), so
 * a fetch mock used for asserting "no LLM/network call happened" must
 * still let `data:` URIs through to the real `fetch`, or PDF
 * generation itself silently fails.
 */
function createLlmFetchMock() {
  const originalFetch = globalThis.fetch;
  return vi.fn((input: RequestInfo | URL, init?: RequestInit): Promise<unknown> => {
    const url = typeof input === 'string' ? input : input.toString();
    if (url.startsWith('data:')) {
      return originalFetch(input, init);
    }
    throw new Error(`Unexpected network request to ${url}`);
  });
}

/**
 * Counts only real LLM/network requests made through a
 * `createLlmFetchMock()`, excluding the PDF renderer's internal
 * `data:` URI fetch (see above).
 */
function countLlmCalls(fetchMock: ReturnType<typeof createLlmFetchMock>): number {
  return fetchMock.mock.calls.filter(([input]) => {
    const url = typeof input === 'string' ? input : (input as { toString(): string }).toString();
    return !url.startsWith('data:');
  }).length;
}

function buildCareerProfileEnvelope() {
  return {
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
  };
}

function buildJobDescriptionEnvelope() {
  return {
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
  };
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
    contact: { fullName: 'Jamie Rivera', otherLinks: [] },
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

function buildResumeEnvelope() {
  return {
    schema_version: '1.0',
    type: 'resume',
    data: {
      contact: { fullName: 'Morgan Chen', email: 'morgan.chen@example.com', otherLinks: [] },
      profileSummary: 'Full-stack engineer.',
      skills: ['TypeScript', 'React'],
      experience: [
        {
          id: 'res-exp-1',
          company: 'Globex Corporation',
          role: 'Senior Software Engineer',
          startDate: { month: 6, year: 2019 },
          isCurrent: true,
          bullets: [{ id: 'b1', text: 'Architected a microservices platform.' }],
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
  };
}

describe('Career Profile shortcut (Stage 14)', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('importing a valid Career Profile file bypasses extraction entirely', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: 'Career Profile' }));

    const file = new File([JSON.stringify(buildCareerProfileEnvelope())], 'career-profile.json', {
      type: 'application/json',
    });
    await user.upload(screen.getByLabelText(/import career profile file/i), file);

    expect(await screen.findByLabelText('Full name')).toHaveValue('Jamie Rivera');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects an invalid Career Profile JSON file with a readable error', async () => {
    vi.stubGlobal('fetch', vi.fn());

    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: 'Career Profile' }));

    const invalidEnvelope = {
      schema_version: '1.0',
      type: 'career-profile',
      data: { personal: {} },
    };
    const file = new File([JSON.stringify(invalidEnvelope)], 'career-profile.json', {
      type: 'application/json',
    });
    await user.upload(screen.getByLabelText(/import career profile file/i), file);

    expect(await screen.findByRole('alert')).toHaveTextContent(/does not match the expected schema/i);
  });
});

describe('Resume-only shortcut (Stage 14)', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('importing, editing, and previewing a Resume never calls the LLM', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const user = userEvent.setup();
    render(<App />);

    // No Configure step is visited at all: no API key, no model.
    await user.click(screen.getByRole('button', { name: 'Resume' }));
    const file = new File([JSON.stringify(buildResumeEnvelope())], 'resume.json', {
      type: 'application/json',
    });
    await user.upload(screen.getByLabelText(/import resume file/i), file);
    await screen.findByLabelText('Full name');

    const summaryField = screen.getByLabelText('Profile summary');
    await user.clear(summaryField);
    await user.type(summaryField, 'Edited summary with no LLM involved.');
    expect(summaryField).toHaveValue('Edited summary with no LLM involved.');

    await user.click(screen.getByRole('button', { name: 'Preview / Export' }));
    expect(await screen.findByText('Edited summary with no LLM involved.')).toBeInTheDocument();

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects an invalid Resume JSON file with a readable error', async () => {
    vi.stubGlobal('fetch', vi.fn());

    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: 'Resume' }));

    const invalidEnvelope = {
      schema_version: '1.0',
      type: 'resume',
      data: { contact: {} },
    };
    const file = new File([JSON.stringify(invalidEnvelope)], 'resume.json', {
      type: 'application/json',
    });
    await user.upload(screen.getByLabelText(/import resume file/i), file);

    expect(await screen.findByRole('alert')).toHaveTextContent(/does not match the expected schema/i);
  });
});

describe('Workflow A end-to-end: imported artifacts through PDF export (Stage 14)', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('generates a resume and exports a PDF from imported Career Profile + Job Description, calling the LLM only for matching and generation', async () => {
    const fetchMock = createLlmFetchMock();
    vi.stubGlobal('fetch', fetchMock);
    const createObjectURL = vi.fn<(blob: Blob) => string>(() => 'blob:mock-url');
    vi.stubGlobal('URL', { ...URL, createObjectURL, revokeObjectURL: vi.fn() });
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: 'Configure' }));
    await user.type(screen.getByLabelText(/api key/i), 'sk-test-key');
    await user.type(screen.getByLabelText(/model/i), 'openai/gpt-4o');

    await user.click(screen.getByRole('button', { name: 'Career Profile' }));
    const careerProfileFile = new File(
      [JSON.stringify(buildCareerProfileEnvelope())],
      'career-profile.json',
      { type: 'application/json' },
    );
    await user.upload(screen.getByLabelText(/import career profile file/i), careerProfileFile);
    await screen.findByLabelText('Full name');

    await user.click(screen.getByRole('button', { name: 'Job Description' }));
    const jdFile = new File([JSON.stringify(buildJobDescriptionEnvelope())], 'job-description.json', {
      type: 'application/json',
    });
    await user.upload(screen.getByLabelText(/import job description file/i), jdFile);
    await screen.findByLabelText('Title');

    // Neither import above should have called the LLM.
    expect(countLlmCalls(fetchMock)).toBe(0);

    await user.click(screen.getByRole('button', { name: 'Match & Tailor' }));
    fetchMock.mockResolvedValueOnce(mockFetchOnce(buildMatchingAnalysisResponse()));
    await user.click(screen.getByRole('button', { name: /generate matching analysis/i }));
    await screen.findByLabelText('Best Match');

    await user.click(screen.getByRole('button', { name: 'Resume' }));
    fetchMock.mockResolvedValueOnce(mockFetchOnce(buildResumeResponse()));
    await user.click(screen.getByRole('button', { name: /generate resume/i }));
    await screen.findByDisplayValue(/platform engineer tailored for the hooli/i);

    // Exactly two LLM calls total: matching analysis, then resume generation.
    expect(countLlmCalls(fetchMock)).toBe(2);

    await user.click(screen.getByRole('button', { name: 'Preview / Export' }));
    await user.click(screen.getByRole('button', { name: /download pdf/i }));
    await waitFor(() => expect(createObjectURL).toHaveBeenCalledTimes(1));

    // PDF export must not have made any further LLM calls (the shared
    // data:-URI allowance above does not count as one).
    expect(countLlmCalls(fetchMock)).toBe(2);
    expect(clickSpy).toHaveBeenCalledTimes(1);

    clickSpy.mockRestore();
  });
});

describe('Workflow B end-to-end: Resume-only through PDF export (Stage 14)', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('imports, edits, previews, and exports a PDF for a Resume with no LLM configuration and no network request', async () => {
    const fetchMock = createLlmFetchMock();
    vi.stubGlobal('fetch', fetchMock);
    const createObjectURL = vi.fn<(blob: Blob) => string>(() => 'blob:mock-url');
    vi.stubGlobal('URL', { ...URL, createObjectURL, revokeObjectURL: vi.fn() });
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    const user = userEvent.setup();
    render(<App />);

    // Deliberately skip Configure: no API key, no model, no LLM provider chosen.
    await user.click(screen.getByRole('button', { name: 'Resume' }));
    const file = new File([JSON.stringify(buildResumeEnvelope())], 'resume.json', {
      type: 'application/json',
    });
    await user.upload(screen.getByLabelText(/import resume file/i), file);
    await screen.findByLabelText('Full name');

    const experienceGroup = screen.getByRole('group', { name: 'Experience 1' });
    const companyInput = within(experienceGroup).getByLabelText('Company');
    await user.clear(companyInput);
    await user.type(companyInput, 'Umbrella Corp');

    await user.click(screen.getByRole('button', { name: 'Preview / Export' }));
    expect(await screen.findByText('Umbrella Corp', { exact: false })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /download pdf/i }));
    await waitFor(() => expect(createObjectURL).toHaveBeenCalledTimes(1));

    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(countLlmCalls(fetchMock)).toBe(0);

    clickSpy.mockRestore();
  });
});
