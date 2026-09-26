/**
 * Shared LLM-generation UI state, used by every workflow step that
 * calls an `LLMClient` (Career Profile extraction, Job Description
 * extraction, Match & Tailor, Resume generation, Cover Letter
 * generation).
 *
 * Unlike a plain `{status: 'error', message: string}` shape, the raw
 * `error` is also retained so the UI can distinguish error types (for
 * example, offering an "Update API Key" recovery action specifically
 * for `LLMAuthenticationError`) without every step needing to
 * duplicate that `instanceof` check inline (plan.md Stage 15;
 * specification.md section 17, "Error Handling").
 */
export type GenerationState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; error: unknown; message: string };

/** Builds a `{status: 'error', ...}` GenerationState from a caught value. */
export function toGenerationErrorState(error: unknown, fallbackMessage: string): GenerationState {
  return {
    status: 'error',
    error,
    message: error instanceof Error ? error.message : fallbackMessage,
  };
}
