import { useAppState } from '../../state/AppContext';
import { LLMAuthenticationError } from '../../clients/llm/types';

interface GenerationErrorAlertProps {
  /** The raw caught error, used only to detect its type (e.g. authentication failure). */
  error: unknown;
  message: string;
  onRetry: () => void;
  retryLabel?: string;
}

/**
 * Shared error display for any LLM generation failure (Career Profile
 * extraction, Job Description extraction, Match & Tailor, Resume
 * generation, Cover Letter generation).
 *
 * Per specification.md section 17 (Error Handling), every LLM failure
 * must show a useful message and a retry option; an authentication
 * failure specifically also gets an "Update API Key" recovery action
 * that jumps to the Configure step and focuses the API key field.
 * Never renders anything from the error object itself besides its
 * message (which the `LLMClient` implementations already guarantee
 * never contains the API key) — no secret is ever displayed or
 * logged.
 */
export function GenerationErrorAlert({
  error,
  message,
  onRetry,
  retryLabel = 'Retry',
}: GenerationErrorAlertProps) {
  const { dispatch } = useAppState();
  const isAuthError = error instanceof LLMAuthenticationError;

  function handleUpdateApiKey() {
    dispatch({ type: 'SET_WORKFLOW_STEP', payload: 'configure' });
    // The Configure step's API key field only exists once the step
    // switch above has re-rendered; focus it on the next frame rather
    // than synchronously.
    requestAnimationFrame(() => {
      document.getElementById('llm-api-key-input')?.focus();
    });
  }

  return (
    <div role="alert" className="career-profile-input-form__error">
      <p>{message}</p>
      <button type="button" onClick={onRetry}>
        {retryLabel}
      </button>
      {isAuthError && (
        <button type="button" onClick={handleUpdateApiKey}>
          Update API Key
        </button>
      )}
    </div>
  );
}
