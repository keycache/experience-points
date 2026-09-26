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

function buildResumeResponse(overrides: Record<string, unknown> = {}) {
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
        bullets: [
          { id: 'b1', text: 'Led migration of Terraform stacks to OpenTofu.' },
          { id: 'b2', text: 'Automated deployment pipelines, reducing release time by 40%.' },
        ],
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
    ...overrides,
  });
}

async function seedThroughMatching(user: ReturnType<typeof userEvent.setup>, fetchMock: ReturnType<typeof vi.fn>) {
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
}

describe('Resume Generation workflow (Stage 9)', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('generates a resume from a Career Profile, Job Description, and Best Match selection', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const user = userEvent.setup();
    render(<App />);
    await seedThroughMatching(user, fetchMock);

    fetchMock.mockResolvedValueOnce(mockFetchOnce(buildResumeResponse()));
    await user.click(screen.getByRole('button', { name: /generate resume/i }));

    expect(
      await screen.findByDisplayValue(/platform engineer tailored for the hooli/i),
    ).toBeInTheDocument();
    expect(screen.getByDisplayValue('Terraform')).toBeInTheDocument();
  });

  it('shows a JD-specific summary and prioritized relevant skills', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const user = userEvent.setup();
    render(<App />);
    await seedThroughMatching(user, fetchMock);

    fetchMock.mockResolvedValueOnce(mockFetchOnce(buildResumeResponse()));
    await user.click(screen.getByRole('button', { name: /generate resume/i }));

    await screen.findByDisplayValue(/platform engineer tailored for the hooli/i);
    const skillsGroup = screen.getByRole('group', { name: 'Skill 1' }).closest('fieldset')!;
    expect(within(skillsGroup).getByDisplayValue('Terraform')).toBeInTheDocument();
    expect(within(skillsGroup).getByDisplayValue('Python')).toBeInTheDocument();
  });

  it('shows the most impactful accomplishment first and respects the 6-bullet maximum', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const user = userEvent.setup();
    render(<App />);
    await seedThroughMatching(user, fetchMock);

    fetchMock.mockResolvedValueOnce(mockFetchOnce(buildResumeResponse()));
    await user.click(screen.getByRole('button', { name: /generate resume/i }));

    const experienceGroup = await screen.findByRole('group', { name: 'Experience 1' });
    const bullets = within(experienceGroup).getAllByLabelText('Bullet text');
    expect(bullets).toHaveLength(2);
    expect(bullets[0]).toHaveValue('Led migration of Terraform stacks to OpenTofu.');
    expect(within(experienceGroup).getByText('2 bullet(s)')).toBeInTheDocument();
  });

  it('rejects a mocked response with more than 6 bullets for a role (bullet count constraint)', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const user = userEvent.setup();
    render(<App />);
    await seedThroughMatching(user, fetchMock);

    const tooManyBullets = Array.from({ length: 7 }, (_, i) => ({ id: `b${i}`, text: `Bullet ${i}.` }));
    fetchMock.mockResolvedValueOnce(
      mockFetchOnce(
        buildResumeResponse({
          experience: [
            {
              id: 'res-exp-1',
              company: 'Initech',
              role: 'Senior Platform Engineer',
              startDate: { month: 3, year: 2021 },
              isCurrent: true,
              bullets: tooManyBullets,
            },
          ],
        }),
      ),
    );

    await user.click(screen.getByRole('button', { name: /generate resume/i }));

    expect(await screen.findByRole('alert')).toBeInTheDocument();
  });

  it('rejects a mocked response with a bullet exceeding the sentence-count constraint', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const user = userEvent.setup();
    render(<App />);
    await seedThroughMatching(user, fetchMock);

    fetchMock.mockResolvedValueOnce(
      mockFetchOnce(
        buildResumeResponse({
          experience: [
            {
              id: 'res-exp-1',
              company: 'Initech',
              role: 'Senior Platform Engineer',
              startDate: { month: 3, year: 2021 },
              isCurrent: true,
              bullets: [{ id: 'b1', text: 'One. Two. Three. Four. Five.' }],
            },
          ],
        }),
      ),
    );

    await user.click(screen.getByRole('button', { name: /generate resume/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/exceeding the maximum/i);
  });

  it('does not fabricate an experience outside the selection', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const user = userEvent.setup();
    render(<App />);
    await seedThroughMatching(user, fetchMock);

    fetchMock.mockResolvedValueOnce(
      mockFetchOnce(
        buildResumeResponse({
          experience: [
            {
              id: 'res-exp-fab',
              company: 'Fabricated Corp',
              role: 'Engineer',
              startDate: { month: 1, year: 2020 },
              isCurrent: true,
              bullets: [{ id: 'b1', text: 'Did something fabricated.' }],
            },
          ],
        }),
      ),
    );

    await user.click(screen.getByRole('button', { name: /generate resume/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/not part of the selected/i);
  });

  it('shows a readable error and allows retry for an invalid resume response', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const user = userEvent.setup();
    render(<App />);
    await seedThroughMatching(user, fetchMock);

    fetchMock.mockResolvedValueOnce(mockFetchOnce('not valid json'));
    fetchMock.mockResolvedValueOnce(mockFetchOnce(buildResumeResponse()));

    await user.click(screen.getByRole('button', { name: /generate resume/i }));
    const alert = await screen.findByRole('alert');
    await user.click(within(alert).getByRole('button', { name: /retry/i }));

    expect(
      await screen.findByDisplayValue(/platform engineer tailored for the hooli/i),
    ).toBeInTheDocument();
  });

  it('produces a different resume after switching to manual selection and choosing a different experience', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const user = userEvent.setup();
    render(<App />);
    await seedThroughMatching(user, fetchMock);

    fetchMock.mockResolvedValueOnce(mockFetchOnce(buildResumeResponse()));
    await user.click(screen.getByRole('button', { name: /generate resume/i }));
    await screen.findByDisplayValue(/platform engineer tailored for the hooli/i);

    // Go back to Match & Tailor, switch to manual selection, deselect the only experience.
    await user.click(screen.getByRole('button', { name: 'Match & Tailor' }));
    await user.click(screen.getByLabelText(/i.?ll select/i));
    await user.click(screen.getByLabelText('Initech — Senior Platform Engineer'));

    await user.click(screen.getByRole('button', { name: 'Resume' }));
    fetchMock.mockResolvedValueOnce(
      mockFetchOnce(buildResumeResponse({ experience: [], profileSummary: 'A different summary entirely.' })),
    );
    await user.click(screen.getByRole('button', { name: /regenerate resume/i }));

    expect(await screen.findByDisplayValue('A different summary entirely.')).toBeInTheDocument();
  });
});
