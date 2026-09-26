import { describe, expect, it, vi } from 'vitest';
import { extractCareerProfile } from '../../../../src/services/career-profile/extractCareerProfile';
import type { LLMClient } from '../../../../src/clients/llm/types';
import { buildValidCareerProfile } from '../../schemas/fixtures';

function mockClient(resolvedValue: unknown): LLMClient {
  return { generateStructured: vi.fn().mockResolvedValue(resolvedValue) };
}

describe('extractCareerProfile', () => {
  it('extracts a Career Profile from raw text', async () => {
    const rawProfile = buildValidCareerProfile();
    const client = mockClient(rawProfile);

    const result = await extractCareerProfile(client, {
      model: 'openai/gpt-4o',
      rawText: 'I worked at Initech as a platform engineer for 5 years.',
    });

    expect(result.personal.fullName).toBe(rawProfile.personal.fullName);
    expect(client.generateStructured).toHaveBeenCalledTimes(1);
  });

  it('includes raw text in the request content', async () => {
    const client = mockClient(buildValidCareerProfile());

    await extractCareerProfile(client, {
      model: 'openai/gpt-4o',
      rawText: 'I worked at Initech as a platform engineer.',
    });

    const request = (client.generateStructured as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(request.userContent).toContainEqual({
      type: 'text',
      text: expect.stringContaining('I worked at Initech as a platform engineer.'),
    });
  });

  it('includes image content in the request', async () => {
    const client = mockClient(buildValidCareerProfile());

    await extractCareerProfile(client, {
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
    const client = mockClient(buildValidCareerProfile());

    await extractCareerProfile(client, {
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

  it('includes both text and images together in the request', async () => {
    const client = mockClient(buildValidCareerProfile());

    await extractCareerProfile(client, {
      model: 'openai/gpt-4o',
      rawText: 'Some raw history.',
      images: [{ dataUrl: 'data:image/png;base64,AAAA', mimeType: 'image/png' }],
    });

    const request = (client.generateStructured as ReturnType<typeof vi.fn>).mock.calls[0][0];
    const types = request.userContent.map((part: { type: string }) => part.type);
    expect(types).toContain('text');
    expect(types).toContain('image');
  });

  it('includes the existing Career Profile as merge context and passes it through the prompt', async () => {
    const existingProfile = buildValidCareerProfile();
    const client = mockClient(existingProfile);

    await extractCareerProfile(client, {
      model: 'openai/gpt-4o',
      rawText: 'I also became a team lead in 2023.',
      existingProfile,
    });

    const request = (client.generateStructured as ReturnType<typeof vi.fn>).mock.calls[0][0];
    const mergeContextPart = request.userContent.find((part: { type: string; text?: string }) =>
      part.text?.includes(existingProfile.personal.fullName),
    );
    expect(mergeContextPart).toBeDefined();
    expect(request.systemPrompt).toMatch(/merge/i);
  });

  it('assigns fresh ids to the resulting profile', async () => {
    const rawProfile = buildValidCareerProfile();
    const originalId = rawProfile.experience[0].id;
    const client = mockClient(rawProfile);

    const result = await extractCareerProfile(client, {
      model: 'openai/gpt-4o',
      rawText: 'Some history.',
    });

    expect(result.experience[0].id).not.toBe(originalId);
  });

  it('propagates errors from the LLM client (e.g. invalid structured output)', async () => {
    const client: LLMClient = {
      generateStructured: vi.fn().mockRejectedValue(new Error('Invalid structured output')),
    };

    await expect(
      extractCareerProfile(client, { model: 'openai/gpt-4o', rawText: 'Some history.' }),
    ).rejects.toThrow(/invalid structured output/i);
  });
});
