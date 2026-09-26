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

function buildCareerProfileEnvelope() {
  return JSON.stringify({
    schema_version: '1.0',
    type: 'career-profile',
    data: {
      personal: { fullName: 'Jamie Rivera', otherLinks: [] },
      experience: [
        {
          id: 'exp-python',
          company: 'Initech',
          role: 'Senior Platform Engineer',
          startDate: { month: 3, year: 2021 },
          isCurrent: true,
          projects: [],
          technologies: ['Python', 'OpenTofu', 'AWS', 'Docker'],
        },
        {
          id: 'exp-jenkins',
          company: 'Old Co',
          role: 'DevOps Engineer',
          startDate: { month: 1, year: 2016 },
          endDate: { month: 2, year: 2021 },
          isCurrent: false,
          projects: [],
          technologies: ['Jenkins', 'AWS'],
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
      technologies: ['Python', 'Terraform', 'AWS', 'Kubernetes', 'GitHub Actions'],
      leadershipExpectations: [],
      domainSignals: [],
      otherSignals: [],
    },
  });
}

function buildMatchingAnalysisResponse(overrides: Record<string, unknown> = {}) {
  return JSON.stringify({
    importantRequirements: ['5+ years with Terraform'],
    relevantExperienceIds: ['exp-python'],
    importantTechnologies: ['Python', 'Terraform', 'AWS'],
    equivalentTechnologies: [
      { jdTechnology: 'Terraform', profileTechnology: 'OpenTofu', rationale: 'Same HCL API' },
    ],
    missingEvidence: ['Kubernetes', 'GitHub Actions'],
    suggestedOrdering: ['exp-python'],
    suggestedSkills: ['Python', 'Terraform'],
    ...overrides,
  });
}

async function seedCareerProfileAndJobDescription(user: ReturnType<typeof userEvent.setup>) {
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
}

describe('Match & Tailor workflow (Stage 8)', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('generates a Matching Analysis and defaults to Best Match selection', async () => {
    const fetchMock = vi.fn().mockResolvedValue(mockFetchOnce(buildMatchingAnalysisResponse()));
    vi.stubGlobal('fetch', fetchMock);

    const user = userEvent.setup();
    render(<App />);
    await seedCareerProfileAndJobDescription(user);

    await user.click(screen.getByRole('button', { name: /generate matching analysis/i }));

    expect(await screen.findByText(/5\+ years with Terraform/)).toBeInTheDocument();
    expect(screen.getByLabelText('Best Match')).toBeChecked();

    const initechCheckbox = screen.getByLabelText('Initech — Senior Platform Engineer');
    expect(initechCheckbox).toBeChecked();
    expect(initechCheckbox).toBeDisabled();
  });

  it('identifies OpenTofu as supporting a Terraform requirement (equivalent technology)', async () => {
    const fetchMock = vi.fn().mockResolvedValue(mockFetchOnce(buildMatchingAnalysisResponse()));
    vi.stubGlobal('fetch', fetchMock);

    const user = userEvent.setup();
    render(<App />);
    await seedCareerProfileAndJobDescription(user);
    await user.click(screen.getByRole('button', { name: /generate matching analysis/i }));

    await screen.findByText(/5\+ years with Terraform/);
    expect(screen.getByText(/OpenTofu/)).toBeInTheDocument();
    expect(screen.getByText(/JD asks for/)).toBeInTheDocument();
  });

  it('shows missing evidence without fabricating unsupported experience', async () => {
    const fetchMock = vi.fn().mockResolvedValue(mockFetchOnce(buildMatchingAnalysisResponse()));
    vi.stubGlobal('fetch', fetchMock);

    const user = userEvent.setup();
    render(<App />);
    await seedCareerProfileAndJobDescription(user);
    await user.click(screen.getByRole('button', { name: /generate matching analysis/i }));

    const missingSection = (await screen.findByText('Missing evidence')).closest('section')!;
    expect(within(missingSection).getByText('Kubernetes')).toBeInTheDocument();
    expect(within(missingSection).getByText('GitHub Actions')).toBeInTheDocument();
  });

  it('allows switching to manual selection and choosing different experiences', async () => {
    const fetchMock = vi.fn().mockResolvedValue(mockFetchOnce(buildMatchingAnalysisResponse()));
    vi.stubGlobal('fetch', fetchMock);

    const user = userEvent.setup();
    render(<App />);
    await seedCareerProfileAndJobDescription(user);
    await user.click(screen.getByRole('button', { name: /generate matching analysis/i }));
    await screen.findByLabelText('Best Match');

    await user.click(screen.getByLabelText(/i.?ll select/i));

    const initechCheckbox = screen.getByLabelText('Initech — Senior Platform Engineer');
    const oldCoCheckbox = screen.getByLabelText('Old Co — DevOps Engineer');
    expect(initechCheckbox).toBeChecked();
    expect(initechCheckbox).not.toBeDisabled();
    expect(oldCoCheckbox).not.toBeChecked();

    // The user selects a different/additional experience than the AI recommended.
    await user.click(oldCoCheckbox);
    expect(oldCoCheckbox).toBeChecked();

    // The user can also change (remove) the AI's own recommendation.
    await user.click(initechCheckbox);
    expect(initechCheckbox).not.toBeChecked();
  });

  it('produces a selection automatically in Best Match mode', async () => {
    const fetchMock = vi.fn().mockResolvedValue(mockFetchOnce(buildMatchingAnalysisResponse()));
    vi.stubGlobal('fetch', fetchMock);

    const user = userEvent.setup();
    render(<App />);
    await seedCareerProfileAndJobDescription(user);
    await user.click(screen.getByRole('button', { name: /generate matching analysis/i }));

    const initechCheckbox = await screen.findByLabelText('Initech — Senior Platform Engineer');
    expect(initechCheckbox).toBeChecked();
  });

  it('shows a readable error and allows retry for an invalid matching response', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(mockFetchOnce('not valid json'))
      .mockResolvedValueOnce(mockFetchOnce(buildMatchingAnalysisResponse()));
    vi.stubGlobal('fetch', fetchMock);

    const user = userEvent.setup();
    render(<App />);
    await seedCareerProfileAndJobDescription(user);

    await user.click(screen.getByRole('button', { name: /generate matching analysis/i }));

    const alert = await screen.findByRole('alert');
    await user.click(within(alert).getByRole('button', { name: /retry/i }));

    expect(await screen.findByText(/5\+ years with Terraform/)).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
