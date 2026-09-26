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

function buildCareerProfileResponse(overrides: Record<string, unknown> = {}) {
  return JSON.stringify({
    personal: { fullName: 'Jamie Rivera', otherLinks: [] },
    experience: [
      {
        id: 'llm-exp-1',
        company: 'Initech',
        role: 'Senior Platform Engineer',
        startDate: { month: 3, year: 2021 },
        isCurrent: true,
        projects: [],
        technologies: ['Python', 'AWS'],
      },
    ],
    skills: [{ id: 'llm-skill-1', name: 'Python' }],
    education: [],
    certifications: [],
    awards: [],
    publications: [],
    projects: [],
    volunteerExperience: [],
    professionalAffiliations: [],
    customSections: [],
    ...overrides,
  });
}

async function goToConfigureAndEnterSettings(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: 'Configure' }));
  await user.type(screen.getByLabelText(/api key/i), 'sk-test-key');
  await user.type(screen.getByLabelText(/model/i), 'openai/gpt-4o');
}

async function goToCareerProfile(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: 'Career Profile' }));
}

describe('Career Profile workflow (Stage 5)', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('extracts a Career Profile from raw text', async () => {
    const fetchMock = vi.fn().mockResolvedValue(mockFetchOnce(buildCareerProfileResponse()));
    vi.stubGlobal('fetch', fetchMock);

    const user = userEvent.setup();
    render(<App />);
    await goToConfigureAndEnterSettings(user);
    await goToCareerProfile(user);

    await user.type(
      screen.getByLabelText(/raw professional history/i),
      'I worked at Initech as a Senior Platform Engineer since March 2021.',
    );
    await user.click(screen.getByRole('button', { name: /generate career profile/i }));

    expect(await screen.findByLabelText('Full name')).toHaveValue('Jamie Rivera');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('accepts a single image as input', async () => {
    const fetchMock = vi.fn().mockResolvedValue(mockFetchOnce(buildCareerProfileResponse()));
    vi.stubGlobal('fetch', fetchMock);

    const user = userEvent.setup();
    render(<App />);
    await goToConfigureAndEnterSettings(user);
    await goToCareerProfile(user);

    const image = new File(['fake-image-bytes'], 'resume.png', { type: 'image/png' });
    await user.upload(screen.getByLabelText(/images \(e\.g\. resume screenshots\)/i), image);
    expect(await screen.findByText('resume.png')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /generate career profile/i }));
    await screen.findByLabelText('Full name');

    const [, requestInit] = fetchMock.mock.calls[0];
    const body = JSON.parse(requestInit.body);
    const imageParts = body.messages[1].content.filter((part: { type: string }) => part.type === 'image_url');
    expect(imageParts).toHaveLength(1);
  });

  it('accepts multiple images as input', async () => {
    const fetchMock = vi.fn().mockResolvedValue(mockFetchOnce(buildCareerProfileResponse()));
    vi.stubGlobal('fetch', fetchMock);

    const user = userEvent.setup();
    render(<App />);
    await goToConfigureAndEnterSettings(user);
    await goToCareerProfile(user);

    const images = [
      new File(['a'], 'resume-page-1.png', { type: 'image/png' }),
      new File(['b'], 'resume-page-2.png', { type: 'image/png' }),
    ];
    await user.upload(screen.getByLabelText(/images \(e\.g\. resume screenshots\)/i), images);
    expect(await screen.findByText('resume-page-1.png')).toBeInTheDocument();
    expect(await screen.findByText('resume-page-2.png')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /generate career profile/i }));
    await screen.findByLabelText('Full name');

    const [, requestInit] = fetchMock.mock.calls[0];
    const body = JSON.parse(requestInit.body);
    const imageParts = body.messages[1].content.filter((part: { type: string }) => part.type === 'image_url');
    expect(imageParts).toHaveLength(2);
  });

  it('accepts raw text and images together', async () => {
    const fetchMock = vi.fn().mockResolvedValue(mockFetchOnce(buildCareerProfileResponse()));
    vi.stubGlobal('fetch', fetchMock);

    const user = userEvent.setup();
    render(<App />);
    await goToConfigureAndEnterSettings(user);
    await goToCareerProfile(user);

    await user.type(screen.getByLabelText(/raw professional history/i), 'Some raw history.');
    const image = new File(['a'], 'resume.png', { type: 'image/png' });
    await user.upload(screen.getByLabelText(/images \(e\.g\. resume screenshots\)/i), image);

    await user.click(screen.getByRole('button', { name: /generate career profile/i }));
    await screen.findByLabelText('Full name');

    const [, requestInit] = fetchMock.mock.calls[0];
    const body = JSON.parse(requestInit.body);
    const types = body.messages[1].content.map((part: { type: string }) => part.type);
    expect(types).toContain('text');
    expect(types).toContain('image_url');
  });

  it('merges new raw information into an existing Career Profile', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(mockFetchOnce(buildCareerProfileResponse()))
      .mockResolvedValueOnce(
        mockFetchOnce(
          buildCareerProfileResponse({
            experience: [
              {
                id: 'llm-exp-2',
                company: 'Initech',
                role: 'Staff Platform Engineer',
                startDate: { month: 3, year: 2021 },
                isCurrent: true,
                projects: [],
                technologies: ['Python', 'AWS'],
              },
            ],
          }),
        ),
      );
    vi.stubGlobal('fetch', fetchMock);

    const user = userEvent.setup();
    render(<App />);
    await goToConfigureAndEnterSettings(user);
    await goToCareerProfile(user);

    await user.type(screen.getByLabelText(/raw professional history/i), 'Initial history.');
    await user.click(screen.getByRole('button', { name: /generate career profile/i }));
    await screen.findByLabelText('Full name');

    await user.click(screen.getByRole('button', { name: /update career profile/i }));
    await screen.findByRole('group', { name: 'Experience 1' });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    const [, secondRequestInit] = fetchMock.mock.calls[1];
    const secondBody = JSON.parse(secondRequestInit.body);
    const mergeContextPart = secondBody.messages[1].content.find((part: { text?: string }) =>
      part.text?.includes('Jamie Rivera'),
    );
    expect(mergeContextPart).toBeDefined();
  });

  it('shows an error for invalid LLM output and allows retry after fixing it', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(mockFetchOnce('this is not valid json'))
      .mockResolvedValueOnce(mockFetchOnce(buildCareerProfileResponse()));
    vi.stubGlobal('fetch', fetchMock);

    const user = userEvent.setup();
    render(<App />);
    await goToConfigureAndEnterSettings(user);
    await goToCareerProfile(user);

    await user.type(screen.getByLabelText(/raw professional history/i), 'Some history.');
    await user.click(screen.getByRole('button', { name: /generate career profile/i }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(/did not match|not valid json|failed/i);

    await user.click(within(alert).getByRole('button', { name: /retry/i }));

    expect(await screen.findByLabelText('Full name')).toHaveValue('Jamie Rivera');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('supports manual editing of a generated Career Profile', async () => {
    const fetchMock = vi.fn().mockResolvedValue(mockFetchOnce(buildCareerProfileResponse()));
    vi.stubGlobal('fetch', fetchMock);

    const user = userEvent.setup();
    render(<App />);
    await goToConfigureAndEnterSettings(user);
    await goToCareerProfile(user);

    await user.type(screen.getByLabelText(/raw professional history/i), 'Some history.');
    await user.click(screen.getByRole('button', { name: /generate career profile/i }));
    await screen.findByLabelText('Full name');

    const experienceGroup = screen.getByRole('group', { name: 'Experience 1' });
    const companyInput = within(experienceGroup).getByLabelText('Company');
    await user.clear(companyInput);
    await user.type(companyInput, 'Umbrella Corp');
    expect(companyInput).toHaveValue('Umbrella Corp');

    const roleInput = within(experienceGroup).getByLabelText('Role');
    await user.clear(roleInput);
    await user.type(roleInput, 'Principal Engineer');
    expect(roleInput).toHaveValue('Principal Engineer');
  });

  it('allows adding a new experience entry', async () => {
    const fetchMock = vi.fn().mockResolvedValue(mockFetchOnce(buildCareerProfileResponse()));
    vi.stubGlobal('fetch', fetchMock);

    const user = userEvent.setup();
    render(<App />);
    await goToConfigureAndEnterSettings(user);
    await goToCareerProfile(user);

    await user.type(screen.getByLabelText(/raw professional history/i), 'Some history.');
    await user.click(screen.getByRole('button', { name: /generate career profile/i }));
    await screen.findByRole('group', { name: 'Experience 1' });

    await user.click(screen.getByRole('button', { name: 'Add experience' }));

    expect(screen.getByRole('group', { name: 'Experience 2' })).toBeInTheDocument();
  });

  it('allows deleting an experience entry', async () => {
    const fetchMock = vi.fn().mockResolvedValue(mockFetchOnce(buildCareerProfileResponse()));
    vi.stubGlobal('fetch', fetchMock);

    const user = userEvent.setup();
    render(<App />);
    await goToConfigureAndEnterSettings(user);
    await goToCareerProfile(user);

    await user.type(screen.getByLabelText(/raw professional history/i), 'Some history.');
    await user.click(screen.getByRole('button', { name: /generate career profile/i }));
    const experienceGroup = await screen.findByRole('group', { name: 'Experience 1' });

    await user.click(within(experienceGroup).getByRole('button', { name: /delete experience 1/i }));

    expect(screen.queryByRole('group', { name: 'Experience 1' })).not.toBeInTheDocument();
  });

  it('allows adding and deleting an accomplishment within a project', async () => {
    const fetchMock = vi.fn().mockResolvedValue(mockFetchOnce(buildCareerProfileResponse()));
    vi.stubGlobal('fetch', fetchMock);

    const user = userEvent.setup();
    render(<App />);
    await goToConfigureAndEnterSettings(user);
    await goToCareerProfile(user);

    await user.type(screen.getByLabelText(/raw professional history/i), 'Some history.');
    await user.click(screen.getByRole('button', { name: /generate career profile/i }));
    const experienceGroup = await screen.findByRole('group', { name: 'Experience 1' });

    await user.click(within(experienceGroup).getByRole('button', { name: 'Add project' }));
    const projectGroup = within(experienceGroup).getByRole('group', { name: 'Project 1' });

    await user.click(within(projectGroup).getByRole('button', { name: 'Add accomplishment' }));
    const accomplishmentGroup = within(projectGroup).getByRole('group', {
      name: 'Accomplishment 1',
    });
    expect(accomplishmentGroup).toBeInTheDocument();

    const descriptionInput = within(accomplishmentGroup).getByLabelText('Description');
    await user.type(descriptionInput, 'Shipped a major infrastructure migration.');
    expect(descriptionInput).toHaveValue('Shipped a major infrastructure migration.');

    await user.click(
      within(projectGroup).getByRole('button', { name: /delete accomplishment 1/i }),
    );

    expect(
      within(projectGroup).queryByRole('group', { name: 'Accomplishment 1' }),
    ).not.toBeInTheDocument();
  });

  it('downloads the Career Profile as career-profile.json', async () => {
    const fetchMock = vi.fn().mockResolvedValue(mockFetchOnce(buildCareerProfileResponse()));
    vi.stubGlobal('fetch', fetchMock);
    const createObjectURL = vi.fn(() => 'blob:mock-url');
    const revokeObjectURL = vi.fn();
    vi.stubGlobal('URL', { ...URL, createObjectURL, revokeObjectURL });
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    const user = userEvent.setup();
    render(<App />);
    await goToConfigureAndEnterSettings(user);
    await goToCareerProfile(user);

    await user.type(screen.getByLabelText(/raw professional history/i), 'Some history.');
    await user.click(screen.getByRole('button', { name: /generate career profile/i }));
    await screen.findByLabelText('Full name');

    await user.click(screen.getByRole('button', { name: /download career profile json/i }));

    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(clickSpy).toHaveBeenCalledTimes(1);

    clickSpy.mockRestore();
  });
});
