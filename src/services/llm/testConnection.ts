import { z } from 'zod';
import type { LLMClient } from '../../clients/llm/types';

/**
 * A minimal structured-generation round trip used purely to verify
 * that the current LLM configuration (API key + model) works.
 *
 * See plan.md Stage 4 manual test: "Use the test connection action."
 * This intentionally reuses `LLMClient.generateStructured` rather than
 * adding a provider-specific "ping" method, so the connection test
 * exercises the same code path as real generation requests.
 */
const TEST_CONNECTION_SCHEMA = z.object({ status: z.literal('ok') });

const TEST_CONNECTION_SYSTEM_PROMPT =
  'You are verifying API connectivity for a resume tailoring application. ' +
  'Respond with only the JSON object {"status":"ok"} and nothing else.';

export async function testLLMConnection(client: LLMClient, model: string): Promise<void> {
  await client.generateStructured({
    model,
    systemPrompt: TEST_CONNECTION_SYSTEM_PROMPT,
    userContent: [{ type: 'text', text: 'ping' }],
    schema: TEST_CONNECTION_SCHEMA,
    temperature: 0,
  });
}
