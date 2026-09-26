import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../../src/app/App';
import { ResumeSchema } from '../../src/schemas/resume';

function buildResumeEnvelope(overrides: Record<string, unknown> = {}) {
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
          bullets: [
            { id: 'b1', text: 'Led migration of Terraform stacks to OpenTofu.' },
            { id: 'b2', text: 'Automated deployment pipelines.' },
          ],
        },
      ],
      education: [{ id: 'edu-1', institution: 'State University', degree: 'B.S. Computer Science' }],
      certifications: [],
      projects: [],
      awards: [],
      publications: [],
      volunteerExperience: [],
      professionalAffiliations: [],
      customSections: [],
      ...overrides,
    },
  });
}

async function importResume(user: ReturnType<typeof userEvent.setup>, envelope = buildResumeEnvelope()) {
  await user.click(screen.getByRole('button', { name: 'Resume' }));
  const file = new File([envelope], 'resume.json', { type: 'application/json' });
  await user.upload(screen.getByLabelText(/import resume file/i), file);
  await screen.findByLabelText('Full name');
}

function stubDownload() {
  const createObjectURL = vi.fn(() => 'blob:mock-url');
  const revokeObjectURL = vi.fn();
  vi.stubGlobal('URL', { ...URL, createObjectURL, revokeObjectURL });
  const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
  return { createObjectURL, revokeObjectURL, clickSpy };
}

describe('Resume Editor (Stage 10)', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('does not require an LLM configuration to import and edit a Resume', async () => {
    const user = userEvent.setup();
    render(<App />);

    await importResume(user);

    expect(screen.getByLabelText('Full name')).toHaveValue('Jamie Rivera');
  });

  it('allows editing the header (contact information)', async () => {
    const user = userEvent.setup();
    render(<App />);
    await importResume(user);

    const email = screen.getByLabelText('Email');
    await user.clear(email);
    await user.type(email, 'new.email@example.com');

    expect(email).toHaveValue('new.email@example.com');
  });

  it('allows editing the profile summary', async () => {
    const user = userEvent.setup();
    render(<App />);
    await importResume(user);

    const summary = screen.getByLabelText('Profile summary');
    await user.clear(summary);
    await user.type(summary, 'A brand new summary.');

    expect(summary).toHaveValue('A brand new summary.');
  });

  it('allows changing skills (edit, add, delete)', async () => {
    const user = userEvent.setup();
    render(<App />);
    await importResume(user);

    const skill1 = screen.getByRole('group', { name: 'Skill 1' });
    const skillInput = within(skill1).getByLabelText('Skill 1');
    await user.clear(skillInput);
    await user.type(skillInput, 'Kubernetes');
    expect(skillInput).toHaveValue('Kubernetes');

    await user.click(screen.getByRole('button', { name: 'Add skill' }));
    expect(screen.getByRole('group', { name: 'Skill 3' })).toBeInTheDocument();

    await user.click(within(skill1).getByRole('button', { name: 'Delete Skill 1' }));
    expect(screen.queryByDisplayValue('Kubernetes')).not.toBeInTheDocument();
  });

  it('allows rewriting, removing, and adding a bullet', async () => {
    const user = userEvent.setup();
    render(<App />);
    await importResume(user);

    const experienceGroup = screen.getByRole('group', { name: 'Experience 1' });

    const firstBullet = within(experienceGroup).getAllByLabelText('Bullet text')[0];
    await user.clear(firstBullet);
    await user.type(firstBullet, 'Rewrote this bullet entirely.');
    expect(firstBullet).toHaveValue('Rewrote this bullet entirely.');

    await user.click(within(experienceGroup).getByRole('button', { name: /delete bullet 2/i }));
    expect(within(experienceGroup).getAllByLabelText('Bullet text')).toHaveLength(1);

    await user.click(within(experienceGroup).getByRole('button', { name: 'Add bullet' }));
    expect(within(experienceGroup).getAllByLabelText('Bullet text')).toHaveLength(2);
  });

  it('allows reordering bullets', async () => {
    const user = userEvent.setup();
    render(<App />);
    await importResume(user);

    const experienceGroup = screen.getByRole('group', { name: 'Experience 1' });
    const bulletsBefore = within(experienceGroup).getAllByLabelText('Bullet text');
    expect(bulletsBefore[0]).toHaveValue('Led migration of Terraform stacks to OpenTofu.');
    expect(bulletsBefore[1]).toHaveValue('Automated deployment pipelines.');

    await user.click(within(experienceGroup).getByRole('button', { name: /move bullet 2 up/i }));

    const bulletsAfter = within(experienceGroup).getAllByLabelText('Bullet text');
    expect(bulletsAfter[0]).toHaveValue('Automated deployment pipelines.');
    expect(bulletsAfter[1]).toHaveValue('Led migration of Terraform stacks to OpenTofu.');
  });

  it('allows reordering experience entries', async () => {
    const user = userEvent.setup();
    render(<App />);
    await importResume(
      user,
      buildResumeEnvelope({
        experience: [
          {
            id: 'res-exp-1',
            company: 'Initech',
            role: 'Senior Platform Engineer',
            startDate: { month: 3, year: 2021 },
            isCurrent: true,
            bullets: [],
          },
          {
            id: 'res-exp-2',
            company: 'Globex',
            role: 'Engineer',
            startDate: { month: 1, year: 2015 },
            endDate: { month: 1, year: 2020 },
            isCurrent: false,
            bullets: [],
          },
        ],
      }),
    );

    expect(screen.getByRole('group', { name: 'Experience 1' })).toBeInTheDocument();
    const experience2 = screen.getByRole('group', { name: 'Experience 2' });
    expect(within(experience2).getByLabelText('Company')).toHaveValue('Globex');

    await user.click(within(experience2).getByRole('button', { name: /move experience 2 up/i }));

    const reorderedFirst = screen.getByRole('group', { name: 'Experience 1' });
    expect(within(reorderedFirst).getByLabelText('Company')).toHaveValue('Globex');
  });

  it('allows editing every other major section: education, certifications, projects, awards, publications, volunteer experience, professional affiliations, custom sections', async () => {
    const user = userEvent.setup();
    render(<App />);
    await importResume(user);

    await user.click(screen.getByRole('button', { name: 'Add certification' }));
    await user.type(screen.getByLabelText('Name'), 'AWS Certified Solutions Architect');
    expect(screen.getByLabelText('Name')).toHaveValue('AWS Certified Solutions Architect');

    await user.click(screen.getByRole('button', { name: 'Add project' }));
    const projectGroup = screen.getByRole('group', { name: 'Project 1' });
    await user.type(within(projectGroup).getByLabelText('Name'), 'Side Project');
    expect(within(projectGroup).getByLabelText('Name')).toHaveValue('Side Project');

    await user.click(screen.getByRole('button', { name: 'Add award' }));
    const awardGroup = screen.getByRole('group', { name: 'Award 1' });
    await user.type(within(awardGroup).getByLabelText('Title'), 'Employee of the Year');
    expect(within(awardGroup).getByLabelText('Title')).toHaveValue('Employee of the Year');

    await user.click(screen.getByRole('button', { name: 'Add publication' }));
    const publicationGroup = screen.getByRole('group', { name: 'Publication 1' });
    await user.type(within(publicationGroup).getByLabelText('Title'), 'A Great Paper');
    expect(within(publicationGroup).getByLabelText('Title')).toHaveValue('A Great Paper');

    await user.click(screen.getByRole('button', { name: 'Add volunteer experience' }));
    const volunteerGroup = screen.getByRole('group', { name: 'Volunteer experience 1' });
    await user.type(within(volunteerGroup).getByLabelText('Organization'), 'Local Food Bank');
    expect(within(volunteerGroup).getByLabelText('Organization')).toHaveValue('Local Food Bank');

    await user.click(screen.getByRole('button', { name: 'Add professional affiliation' }));
    const affiliationGroup = screen.getByRole('group', { name: 'Professional affiliation 1' });
    await user.type(within(affiliationGroup).getByLabelText('Organization'), 'ACM');
    expect(within(affiliationGroup).getByLabelText('Organization')).toHaveValue('ACM');

    await user.click(screen.getByRole('button', { name: 'Add custom section' }));
    const customSectionGroup = screen.getByRole('group', { name: 'Custom section 1' });
    await user.type(within(customSectionGroup).getByLabelText('Title'), 'Languages');
    expect(within(customSectionGroup).getByLabelText('Title')).toHaveValue('Languages');

    // Education (already present from the fixture) can also be edited.
    const educationGroup = screen.getByRole('group', { name: 'Education 1' });
    const institution = within(educationGroup).getByLabelText('Institution');
    await user.clear(institution);
    await user.type(institution, 'A Different University');
    expect(institution).toHaveValue('A Different University');
  });

  it('allows deleting items from a section', async () => {
    const user = userEvent.setup();
    render(<App />);
    await importResume(user);

    expect(screen.getByRole('group', { name: 'Education 1' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /delete education 1/i }));
    expect(screen.queryByRole('group', { name: 'Education 1' })).not.toBeInTheDocument();
  });

  it('exports the edited Resume as JSON and the edits survive a re-import round trip', async () => {
    const user = userEvent.setup();
    render(<App />);
    await importResume(user);

    const summary = screen.getByLabelText('Profile summary');
    await user.clear(summary);
    await user.type(summary, 'An edited summary that should survive export/import.');

    const experienceGroup = screen.getByRole('group', { name: 'Experience 1' });
    const firstBullet = within(experienceGroup).getAllByLabelText('Bullet text')[0];
    await user.clear(firstBullet);
    await user.type(firstBullet, 'An edited bullet.');

    let capturedBlobText = '';
    const originalBlob = globalThis.Blob;
    class CapturingBlob extends originalBlob {
      constructor(parts: BlobPart[], options?: BlobPropertyBag) {
        super(parts, options);
        capturedBlobText = parts.join('');
      }
    }
    vi.stubGlobal('Blob', CapturingBlob);
    stubDownload();

    await user.click(screen.getByRole('button', { name: /download resume json/i }));

    const envelope = JSON.parse(capturedBlobText);
    expect(envelope.type).toBe('resume');
    expect(ResumeSchema.safeParse(envelope.data).success).toBe(true);
    expect(envelope.data.profileSummary).toBe(
      'An edited summary that should survive export/import.',
    );

    // Re-import the exported JSON on a fresh session and confirm the edits remain.
    const file = new File([capturedBlobText], 'resume.json', { type: 'application/json' });
    await user.upload(screen.getByLabelText(/import resume file/i), file);

    expect(await screen.findByLabelText('Profile summary')).toHaveValue(
      'An edited summary that should survive export/import.',
    );
    expect(
      within(screen.getByRole('group', { name: 'Experience 1' })).getAllByLabelText('Bullet text')[0],
    ).toHaveValue('An edited bullet.');
  });

  it('editing the Resume does not modify the Career Profile', async () => {
    const user = userEvent.setup();
    render(<App />);

    const careerProfileEnvelope = JSON.stringify({
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
    await user.click(screen.getByRole('button', { name: 'Career Profile' }));
    const careerProfileFile = new File([careerProfileEnvelope], 'career-profile.json', {
      type: 'application/json',
    });
    await user.upload(screen.getByLabelText(/import career profile file/i), careerProfileFile);
    await screen.findByLabelText('Full name');

    await importResume(user);
    const summary = screen.getByLabelText('Profile summary');
    await user.clear(summary);
    await user.type(summary, 'Edited resume summary.');

    await user.click(screen.getByRole('button', { name: 'Career Profile' }));
    expect(screen.getByLabelText('Full name')).toHaveValue('Jamie Rivera');
  });
});
