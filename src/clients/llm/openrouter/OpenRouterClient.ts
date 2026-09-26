import { z } from 'zod';
import {
  LLMAuthenticationError,
  LLMInvalidResponseError,
  LLMNetworkError,
  LLMProviderError,
  type LLMClient,
  type LLMContent,
  type StructuredGenerationRequest,
} from '../types';
import type {
  OpenRouterChatCompletionRequest,
  OpenRouterChatCompletionResponse,
  OpenRouterContentPart,
  OpenRouterErrorResponse,
} from './types';

const OPENROUTER_CHAT_COMPLETIONS_URL = 'https://openrouter.ai/api/v1/chat/completions';

function toOpenRouterContentParts(content: LLMContent[]): OpenRouterContentPart[] {
  return content.map((item) =>
    item.type === 'text'
      ? { type: 'text', text: item.text }
      : { type: 'image_url', image_url: { url: item.dataUrl } },
  );
}

async function safeReadErrorMessage(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as OpenRouterErrorResponse;
    if (body.error?.message) {
      return body.error.message;
    }
  } catch {
    // Response body was not JSON or was empty; fall through to a generic message.
  }
  return response.statusText || `HTTP ${response.status}`;
}

/**
 * `LLMClient` implementation that talks directly to the OpenRouter API
 * from the browser.
 *
 * See specification.md section 5.2 (Provider interface) and section 6
 * (OpenRouter Configuration). This is the only module in the
 * application that should know about OpenRouter's request/response
 * shape; everything else depends on the provider-neutral `LLMClient`
 * interface.
 */
export class OpenRouterClient implements LLMClient {
  private readonly apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateStructured<T>(request: StructuredGenerationRequest<T>): Promise<T> {
    const jsonSchema = z.toJSONSchema(request.schema, { target: 'draft-7' });

    const body: OpenRouterChatCompletionRequest = {
      model: request.model,
      messages: [
        { role: 'system', content: request.systemPrompt },
        { role: 'user', content: toOpenRouterContentParts(request.userContent) },
      ],
      temperature: request.temperature,
      response_format: {
        type: 'json_schema',
        json_schema: { name: 'structured_output', strict: true, schema: jsonSchema },
      },
    };

    let response: Response;
    try {
      response = await fetch(OPENROUTER_CHAT_COMPLETIONS_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
    } catch {
      throw new LLMNetworkError();
    }

    if (response.status === 401) {
      throw new LLMAuthenticationError();
    }

    if (!response.ok) {
      const message = await safeReadErrorMessage(response);
      throw new LLMProviderError(`OpenRouter request failed: ${message}`, response.status);
    }

    const payload = (await response.json()) as OpenRouterChatCompletionResponse;
    const rawContent = payload.choices?.[0]?.message?.content;

    if (typeof rawContent !== 'string' || rawContent.length === 0) {
      throw new LLMInvalidResponseError('The provider response did not contain any content.');
    }

    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(rawContent);
    } catch {
      throw new LLMInvalidResponseError('The provider response was not valid JSON.', rawContent);
    }

    const result = request.schema.safeParse(parsedJson);
    if (!result.success) {
      throw new LLMInvalidResponseError(
        'The provider response did not match the expected structure.',
        rawContent,
      );
    }

    return result.data;
  }
}
