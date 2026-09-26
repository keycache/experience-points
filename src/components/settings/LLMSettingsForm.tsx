import { useState } from 'react';
import { useAppState } from '../../state/AppContext';

/**
 * LLM provider configuration form.
 *
 * See specification.md section 6 (OpenRouter Configuration). Only
 * OpenRouter is supported initially, so the provider field is fixed.
 * The API key and model are held only in the in-memory application
 * state (`useAppState`) — never written to any storage mechanism.
 */
export function LLMSettingsForm() {
  const { state, dispatch } = useAppState();
  const [showApiKey, setShowApiKey] = useState(false);

  return (
    <div className="llm-settings-form">
      <div className="llm-settings-form__field">
        <span className="llm-settings-form__label">LLM Provider</span>
        <span>OpenRouter</span>
      </div>

      <div className="llm-settings-form__field">
        <label htmlFor="llm-api-key-input">API Key</label>
        <div className="llm-settings-form__api-key-row">
          <input
            id="llm-api-key-input"
            type={showApiKey ? 'text' : 'password'}
            autoComplete="off"
            value={state.llm.apiKey}
            onChange={(event) =>
              dispatch({ type: 'SET_LLM_SETTINGS', payload: { apiKey: event.target.value } })
            }
          />
          <button type="button" onClick={() => setShowApiKey((current) => !current)}>
            {showApiKey ? 'Hide' : 'Show'}
          </button>
        </div>
      </div>

      <div className="llm-settings-form__field">
        <label htmlFor="llm-model-input">Model</label>
        <input
          id="llm-model-input"
          type="text"
          placeholder="e.g. openai/gpt-4o"
          value={state.llm.model}
          onChange={(event) =>
            dispatch({ type: 'SET_LLM_SETTINGS', payload: { model: event.target.value } })
          }
        />
      </div>
    </div>
  );
}
