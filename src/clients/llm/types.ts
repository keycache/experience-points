import type { z } from 'zod';

/**
 * Provider-neutral LLM client interface.
 *
 * See specification.md section 5 (LLM Provider Abstraction). The rest
 * of the application (career-profile/job-description/matching/resume
 * services) must depend only on `LLMClient` and never reference a
 * specific provider (e.g. OpenRouter) directly.
 */

export type LLMContent =
  | { type: 'text'; text: string }
  | { type: 'image'; dataUrl: string; mimeType: string };

export interface StructuredGenerationRequest<T> {
  model: string;
  systemPrompt: string;
  userContent: LLMContent[];
  /** A Zod schema describing the expected structured output shape. */
  schema: z.ZodType<T>;
  temperature?: number;
}

export interface LLMClient {
  generateStructured<T>(request: StructuredGenerationRequest<T>): Promise<T>;
}

/** Base class for all LLM-related errors thrown by an `LLMClient`. */
export class LLMError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LLMError';
  }
}

/** The provider rejected the request due to an invalid/missing API key. */
export class LLMAuthenticationError extends LLMError {
  constructor(message = 'Authentication failed. Check your API key.') {
    super(message);
    this.name = 'LLMAuthenticationError';
  }
}

/** The provider returned a non-authentication error response. */
export class LLMProviderError extends LLMError {
  public readonly statusCode?: number;

  constructor(message: string, statusCode?: number) {
    super(message);
    this.name = 'LLMProviderError';
    this.statusCode = statusCode;
  }
}

/** The request could not reach the provider at all (offline, DNS, CORS, etc). */
export class LLMNetworkError extends LLMError {
  constructor(message = 'Could not reach the LLM provider. Check your network connection.') {
    super(message);
    this.name = 'LLMNetworkError';
  }
}

/**
 * The provider responded successfully, but its content was not valid
 * JSON or did not match the requested schema.
 */
export class LLMInvalidResponseError extends LLMError {
  public readonly rawContent?: string;

  constructor(message: string, rawContent?: string) {
    super(message);
    this.name = 'LLMInvalidResponseError';
    this.rawContent = rawContent;
  }
}
