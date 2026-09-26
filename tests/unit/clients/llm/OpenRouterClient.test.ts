import { afterEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { OpenRouterClient } from '../../../../src/clients/llm/openrouter/OpenRouterClient';
import {
  LLMAuthenticationError,
  LLMInvalidResponseError,
  LLMNetworkError,
  LLMProviderError,
} from '../../../../src/clients/llm/types';

const TEST_SCHEMA = z.object({ status: z.literal('ok') });

function mockFetchResponse(options: {
  ok: boolean;
  status: number;
  statusText?: string;
  json: unknown;
}) {
  return vi.fn().mockResolvedValue({
    ok: options.ok,
    status: options.status,
    statusText: options.statusText ?? '',
    json: async () => options.json,
  });
}

describe('OpenRouterClient.generateStructured', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns validated data for a successful structured response', async () => {
    const fetchMock = mockFetchResponse({
      ok: true,
      status: 200,
      json: { choices: [{ message: { content: '{"status":"ok"}' } }] },
    });
    vi.stubGlobal('fetch', fetchMock);

    const client = new OpenRouterClient('sk-not-a-real-key');
    const result = await client.generateStructured({
      model: 'openai/gpt-4o',
      systemPrompt: 'Respond with status ok.',
      userContent: [{ type: 'text', text: 'ping' }],
      schema: TEST_SCHEMA,
    });

    expect(result).toEqual({ status: 'ok' });
  });

  it('throws LLMAuthenticationError on a 401 response', async () => {
    const fetchMock = mockFetchResponse({
      ok: false,
      status: 401,
      json: { error: { message: 'Invalid API key' } },
    });
    vi.stubGlobal('fetch', fetchMock);

    const client = new OpenRouterClient('sk-invalid-key');

    await expect(
      client.generateStructured({
        model: 'openai/gpt-4o',
        systemPrompt: 'Respond with status ok.',
        userContent: [{ type: 'text', text: 'ping' }],
        schema: TEST_SCHEMA,
      }),
    ).rejects.toBeInstanceOf(LLMAuthenticationError);
  });

  it('throws LLMProviderError on a non-auth provider error', async () => {
    const fetchMock = mockFetchResponse({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      json: { error: { message: 'Something went wrong upstream' } },
    });
    vi.stubGlobal('fetch', fetchMock);

    const client = new OpenRouterClient('sk-not-a-real-key');

    const request = {
      model: 'openai/gpt-4o',
      systemPrompt: 'Respond with status ok.',
      userContent: [{ type: 'text' as const, text: 'ping' }],
      schema: TEST_SCHEMA,
    };

    await expect(client.generateStructured(request)).rejects.toBeInstanceOf(LLMProviderError);

    try {
      await client.generateStructured(request);
      expect.fail('Expected generateStructured to throw');
    } catch (error) {
      expect(error).toBeInstanceOf(LLMProviderError);
      expect((error as LLMProviderError).statusCode).toBe(500);
      expect((error as LLMProviderError).message).toMatch(/something went wrong upstream/i);
    }
  });

  it('throws LLMNetworkError when fetch itself fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new TypeError('Failed to fetch')),
    );

    const client = new OpenRouterClient('sk-not-a-real-key');

    await expect(
      client.generateStructured({
        model: 'openai/gpt-4o',
        systemPrompt: 'Respond with status ok.',
        userContent: [{ type: 'text', text: 'ping' }],
        schema: TEST_SCHEMA,
      }),
    ).rejects.toBeInstanceOf(LLMNetworkError);
  });

  it('throws LLMInvalidResponseError when content is not valid JSON', async () => {
    const fetchMock = mockFetchResponse({
      ok: true,
      status: 200,
      json: { choices: [{ message: { content: 'not json at all' } }] },
    });
    vi.stubGlobal('fetch', fetchMock);

    const client = new OpenRouterClient('sk-not-a-real-key');

    await expect(
      client.generateStructured({
        model: 'openai/gpt-4o',
        systemPrompt: 'Respond with status ok.',
        userContent: [{ type: 'text', text: 'ping' }],
        schema: TEST_SCHEMA,
      }),
    ).rejects.toBeInstanceOf(LLMInvalidResponseError);
  });

  it('throws LLMInvalidResponseError when content does not match the schema', async () => {
    const fetchMock = mockFetchResponse({
      ok: true,
      status: 200,
      json: { choices: [{ message: { content: '{"status":"not-ok"}' } }] },
    });
    vi.stubGlobal('fetch', fetchMock);

    const client = new OpenRouterClient('sk-not-a-real-key');

    await expect(
      client.generateStructured({
        model: 'openai/gpt-4o',
        systemPrompt: 'Respond with status ok.',
        userContent: [{ type: 'text', text: 'ping' }],
        schema: TEST_SCHEMA,
      }),
    ).rejects.toBeInstanceOf(LLMInvalidResponseError);
  });

  it('constructs a text-only request body', async () => {
    const fetchMock = mockFetchResponse({
      ok: true,
      status: 200,
      json: { choices: [{ message: { content: '{"status":"ok"}' } }] },
    });
    vi.stubGlobal('fetch', fetchMock);

    const client = new OpenRouterClient('sk-not-a-real-key');
    await client.generateStructured({
      model: 'openai/gpt-4o',
      systemPrompt: 'Respond with status ok.',
      userContent: [{ type: 'text', text: 'Here is my raw career history.' }],
      schema: TEST_SCHEMA,
    });

    const [, requestInit] = fetchMock.mock.calls[0];
    const requestBody = JSON.parse(requestInit.body);

    expect(requestBody.model).toBe('openai/gpt-4o');
    expect(requestBody.messages[1].content).toEqual([
      { type: 'text', text: 'Here is my raw career history.' },
    ]);
    expect(requestBody.response_format.type).toBe('json_schema');
    expect(requestInit.headers.Authorization).toBe('Bearer sk-not-a-real-key');
  });

  it('constructs a request body including image content', async () => {
    const fetchMock = mockFetchResponse({
      ok: true,
      status: 200,
      json: { choices: [{ message: { content: '{"status":"ok"}' } }] },
    });
    vi.stubGlobal('fetch', fetchMock);

    const client = new OpenRouterClient('sk-not-a-real-key');
    await client.generateStructured({
      model: 'openai/gpt-4o',
      systemPrompt: 'Respond with status ok.',
      userContent: [
        { type: 'text', text: 'See attached screenshot.' },
        { type: 'image', dataUrl: 'data:image/png;base64,AAAA', mimeType: 'image/png' },
      ],
      schema: TEST_SCHEMA,
    });

    const [, requestInit] = fetchMock.mock.calls[0];
    const requestBody = JSON.parse(requestInit.body);

    expect(requestBody.messages[1].content).toEqual([
      { type: 'text', text: 'See attached screenshot.' },
      { type: 'image_url', image_url: { url: 'data:image/png;base64,AAAA' } },
    ]);
  });
});
