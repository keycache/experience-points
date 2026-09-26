import { describe, expect, it } from 'vitest';
import { createLLMClient } from '../../../../src/clients/llm/createLLMClient';
import { OpenRouterClient } from '../../../../src/clients/llm/openrouter/OpenRouterClient';

describe('createLLMClient', () => {
  it('creates an OpenRouterClient for the openrouter provider', () => {
    const client = createLLMClient({ provider: 'openrouter', apiKey: 'sk-test', model: 'openai/gpt-4o' });

    expect(client).toBeInstanceOf(OpenRouterClient);
  });
});
