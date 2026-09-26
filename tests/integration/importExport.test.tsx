import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SchemaPlayground } from '../../src/components/dev/SchemaPlayground';
import { CAREER_PROFILE_ARTIFACT, serializeArtifact } from '../../src/services/import-export/artifacts';
import { buildValidCareerProfile } from '../unit/schemas/fixtures';

function stubDownload() {
  const createObjectURL = vi.fn(() => 'blob:mock-url');
  const revokeObjectURL = vi.fn();
  vi.stubGlobal('URL', { ...URL, createObjectURL, revokeObjectURL });
  const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
  return { createObjectURL, revokeObjectURL, clickSpy };
}

describe('Import/Export round trip (Stage 3)', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('downloads a valid Career Profile as career-profile.json', async () => {
    const { createObjectURL } = stubDownload();
    const user = userEvent.setup();
    render(<SchemaPlayground />);

    fireEvent.change(screen.getByLabelText(/json input/i), {
      target: { value: JSON.stringify(buildValidCareerProfile()) },
    });
    await user.click(screen.getByRole('button', { name: /download json/i }));

    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('status')).toHaveTextContent(/downloaded career-profile\.json/i);
  });

  it('imports a valid Career Profile file and shows the data', async () => {
    const user = userEvent.setup();
    render(<SchemaPlayground />);

    const careerProfile = buildValidCareerProfile();
    const json = serializeArtifact(CAREER_PROFILE_ARTIFACT, careerProfile);
    const file = new File([json], 'career-profile.json', { type: 'application/json' });

    await user.upload(screen.getByLabelText(/import artifact file/i), file);

    expect(await screen.findByRole('status')).toHaveTextContent(/imported career-profile\.json successfully/i);
    expect(screen.getByLabelText(/json input/i)).toHaveValue(
      JSON.stringify(careerProfile, null, 2),
    );
  });

  it('imports a valid Job Description file after switching artifact type', async () => {
    const user = userEvent.setup();
    render(<SchemaPlayground />);

    await user.selectOptions(screen.getByLabelText(/artifact type/i), 'job-description');

    const jobDescription = { metadata: { title: 'Senior Platform Engineer' } };
    const json = JSON.stringify({
      schema_version: '1.0',
      type: 'job-description',
      data: jobDescription,
    });
    const file = new File([json], 'job-description.json', { type: 'application/json' });

    await user.upload(screen.getByLabelText(/import artifact file/i), file);

    expect(await screen.findByRole('status')).toHaveTextContent(/imported job-description\.json successfully/i);
  });

  it('imports a valid Resume file after switching artifact type', async () => {
    const user = userEvent.setup();
    render(<SchemaPlayground />);

    await user.selectOptions(screen.getByLabelText(/artifact type/i), 'resume');

    const resume = { contact: { fullName: 'Jamie Rivera' } };
    const json = JSON.stringify({ schema_version: '1.0', type: 'resume', data: resume });
    const file = new File([json], 'resume.json', { type: 'application/json' });

    await user.upload(screen.getByLabelText(/import artifact file/i), file);

    expect(await screen.findByRole('status')).toHaveTextContent(/imported resume\.json successfully/i);
  });

  it('rejects an imported file with invalid JSON syntax', async () => {
    const user = userEvent.setup();
    render(<SchemaPlayground />);

    const file = new File(['{ not valid json'], 'career-profile.json', {
      type: 'application/json',
    });

    await user.upload(screen.getByLabelText(/import artifact file/i), file);

    expect(await screen.findByRole('alert')).toBeInTheDocument();
  });

  it('rejects an imported file declaring the wrong artifact type', async () => {
    const user = userEvent.setup();
    render(<SchemaPlayground />);

    const json = JSON.stringify({
      schema_version: '1.0',
      type: 'job-description',
      data: { metadata: { title: 'Engineer' } },
    });
    const file = new File([json], 'job-description.json', { type: 'application/json' });

    // Artifact type selector is still "career-profile" (default).
    await user.upload(screen.getByLabelText(/import artifact file/i), file);

    expect(await screen.findByRole('alert')).toHaveTextContent(/expected artifact type "career-profile"/i);
  });

  it('rejects an imported file with an unsupported schema version', async () => {
    const user = userEvent.setup();
    render(<SchemaPlayground />);

    const json = JSON.stringify({
      schema_version: '99.0',
      type: 'career-profile',
      data: buildValidCareerProfile(),
    });
    const file = new File([json], 'career-profile.json', { type: 'application/json' });

    await user.upload(screen.getByLabelText(/import artifact file/i), file);

    expect(await screen.findByRole('alert')).toHaveTextContent(/unsupported schema version/i);
  });
});
