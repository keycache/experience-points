import { useState } from 'react';
import { createLLMClient } from '../../clients/llm/createLLMClient';
import { LLMAuthenticationError } from '../../clients/llm/types';
import { testLLMConnection } from '../../services/llm/testConnection';
import { useAppState } from '../../state/AppContext';

type TestConnectionState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success' }
  | { status: 'error'; isAuthError: boolean; message: string };

/**
 * "Test Connection" action for the Configure step.
 *
 * See specification.md section 6 (OpenRouter Configuration) and
 * plan.md Stage 4 manual test: a successful test confirms the key and
 * model work; an authentication failure surfaces a clear error with
 * both a Retry action and an "Update API Key" action that returns
 * focus to the API key field.
 */
export function TestConnectionButton() {
  const { state } = useAppState();
  const [result, setResult] = useState<TestConnectionState>({ status: 'idle' });

  async function runTest() {
    setResult({ status: 'loading' });
    try {
      const client = createLLMClient(state.llm);
      await testLLMConnection(client, state.llm.model);
      setResult({ status: 'success' });
    } catch (error) {
      const isAuthError = error instanceof LLMAuthenticationError;
      const message = error instanceof Error ? error.message : 'Connection test failed.';
      setResult({ status: 'error', isAuthError, message });
    }
  }

  function focusApiKeyField() {
    const apiKeyInput = document.getElementById('llm-api-key-input');
    apiKeyInput?.focus();
  }

  return (
    <div className="test-connection">
      <button
        type="button"
        onClick={runTest}
        disabled={!state.llm.apiKey || !state.llm.model || result.status === 'loading'}
      >
        {result.status === 'loading' ? 'Testing connection…' : 'Test Connection'}
      </button>

      <div aria-live="polite">
        {result.status === 'success' && (
          <p role="status" className="test-connection__success">
            Connection succeeded.
          </p>
        )}
        {result.status === 'error' && (
          <div role="alert" className="test-connection__error">
            <p>{result.isAuthError ? 'Authentication failed.' : 'Connection test failed.'}</p>
            <p>{result.message}</p>
            <button type="button" onClick={runTest}>
              Retry
            </button>
            {result.isAuthError && (
              <button type="button" onClick={focusApiKeyField}>
                Update API Key
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
