import { describe, expect, it, vi } from 'vitest';
import { testLLMConnection } from '../../../src/services/llm/testConnection';
import type { LLMClient } from '../../../src/clients/llm/types';
import { LLMAuthenticationError } from '../../../src/clients/llm/types';

describe('testLLMConnection', () => {
  it('resolves when the client returns a valid structured response', async () => {
    const client: LLMClient = {
      generateStructured: vi.fn().mockResolvedValue({ status: 'ok' }),
    };

    await expect(testLLMConnection(client, 'openai/gpt-4o')).resolves.toBeUndefined();
    expect(client.generateStructured).toHaveBeenCalledTimes(1);
  });

  it('propagates errors from the underlying client', async () => {
    const client: LLMClient = {
      generateStructured: vi.fn().mockRejectedValue(new LLMAuthenticationError()),
    };

    await expect(testLLMConnection(client, 'openai/gpt-4o')).rejects.toBeInstanceOf(
      LLMAuthenticationError,
    );
  });
});
