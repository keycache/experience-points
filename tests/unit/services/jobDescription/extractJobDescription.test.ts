import { describe, expect, it, vi } from 'vitest';
import { extractJobDescription } from '../../../../src/services/job-description/extractJobDescription';
import type { LLMClient } from '../../../../src/clients/llm/types';

function buildJobDescription() {
  return {
    metadata: { title: 'Senior Platform Engineer', company: 'Hooli', location: 'Remote' },
    summary: 'Own our cloud infrastructure.',
    responsibilities: ['Design and operate Kubernetes clusters'],
    requirements: ['5+ years with Terraform'],
    preferredQualifications: [],
    technologies: ['Python', 'Terraform', 'AWS'],
    leadershipExpectations: [],
    domainSignals: [],
    otherSignals: [],
  };
}

function mockClient(resolvedValue: unknown): LLMClient {
  return { generateStructured: vi.fn().mockResolvedValue(resolvedValue) };
}

describe('extractJobDescription', () => {
  it('extracts a Job Description from raw text', async () => {
    const jd = buildJobDescription();
    const client = mockClient(jd);

    const result = await extractJobDescription(client, {
      model: 'openai/gpt-4o',
      rawText: 'Senior Platform Engineer at Hooli, remote, requires 5+ years Terraform.',
    });

    expect(result.metadata.title).toBe('Senior Platform Engineer');
    expect(client.generateStructured).toHaveBeenCalledTimes(1);
  });

  it('includes raw text in the request content', async () => {
    const client = mockClient(buildJobDescription());

    await extractJobDescription(client, {
      model: 'openai/gpt-4o',
      rawText: 'Senior Platform Engineer at Hooli.',
    });

    const request = (client.generateStructured as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(request.userContent).toContainEqual({
      type: 'text',
      text: expect.stringContaining('Senior Platform Engineer at Hooli.'),
    });
  });

  it('includes image content in the request', async () => {
    const client = mockClient(buildJobDescription());

    await extractJobDescription(client, {
      model: 'openai/gpt-4o',
      images: [{ dataUrl: 'data:image/png;base64,AAAA', mimeType: 'image/png' }],
    });

    const request = (client.generateStructured as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(request.userContent).toContainEqual({
      type: 'image',
      dataUrl: 'data:image/png;base64,AAAA',
      mimeType: 'image/png',
    });
  });

  it('includes multiple images in the request', async () => {
    const client = mockClient(buildJobDescription());

    await extractJobDescription(client, {
      model: 'openai/gpt-4o',
      images: [
        { dataUrl: 'data:image/png;base64,AAAA', mimeType: 'image/png' },
        { dataUrl: 'data:image/png;base64,BBBB', mimeType: 'image/png' },
      ],
    });

    const request = (client.generateStructured as ReturnType<typeof vi.fn>).mock.calls[0][0];
    const imageParts = request.userContent.filter((part: { type: string }) => part.type === 'image');
    expect(imageParts).toHaveLength(2);
  });

  it('propagates errors from the LLM client', async () => {
    const client: LLMClient = {
      generateStructured: vi.fn().mockRejectedValue(new Error('Invalid structured output')),
    };

    await expect(
      extractJobDescription(client, { model: 'openai/gpt-4o', rawText: 'Some JD text.' }),
    ).rejects.toThrow(/invalid structured output/i);
  });
});
