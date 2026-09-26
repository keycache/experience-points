/**
 * Minimal typings for the subset of the OpenRouter chat completions API
 * this client uses. OpenRouter's API is OpenAI-compatible.
 *
 * See https://openrouter.ai/docs for the full API surface — only the
 * fields this application actually sends/reads are declared here.
 */

export type OpenRouterContentPart =
  | { type: 'text'; text: string }
  | { type: 'image_url'; image_url: { url: string } };

export interface OpenRouterMessage {
  role: 'system' | 'user';
  content: string | OpenRouterContentPart[];
}

export interface OpenRouterJsonSchemaResponseFormat {
  type: 'json_schema';
  json_schema: {
    name: string;
    strict: true;
    schema: unknown;
  };
}

export interface OpenRouterChatCompletionRequest {
  model: string;
  messages: OpenRouterMessage[];
  temperature?: number;
  response_format: OpenRouterJsonSchemaResponseFormat;
}

export interface OpenRouterChatCompletionResponse {
  choices?: Array<{
    message?: {
      content?: string | null;
    };
  }>;
}

export interface OpenRouterErrorResponse {
  error?: {
    message?: string;
    code?: number | string;
  };
}
