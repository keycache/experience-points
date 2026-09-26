import { describe, expect, it } from 'vitest';
import { appReducer } from '../../../src/state/reducers/appReducer';
import { createInitialAppState } from '../../../src/state/AppState';

describe('appReducer', () => {
  it('stores the API key in state after SET_LLM_SETTINGS', () => {
    const state = createInitialAppState();

    const next = appReducer(state, {
      type: 'SET_LLM_SETTINGS',
      payload: { apiKey: 'sk-test-secret-12345' },
    });

    expect(next.llm.apiKey).toBe('sk-test-secret-12345');
  });

  it('merges partial LLM settings updates without clobbering other fields', () => {
    const state = createInitialAppState();
    const withKey = appReducer(state, {
      type: 'SET_LLM_SETTINGS',
      payload: { apiKey: 'sk-test-secret-12345' },
    });

    const withModel = appReducer(withKey, {
      type: 'SET_LLM_SETTINGS',
      payload: { model: 'openai/gpt-4o' },
    });

    expect(withModel.llm.apiKey).toBe('sk-test-secret-12345');
    expect(withModel.llm.model).toBe('openai/gpt-4o');
  });

  it('removes the API key when the session is cleared', () => {
    const state = createInitialAppState();
    const withKey = appReducer(state, {
      type: 'SET_LLM_SETTINGS',
      payload: { apiKey: 'sk-test-secret-12345', model: 'openai/gpt-4o' },
    });

    const cleared = appReducer(withKey, { type: 'CLEAR_SESSION' });

    expect(cleared.llm.apiKey).toBe('');
    expect(cleared.llm.model).toBe('');
  });

  it('updates the current workflow step', () => {
    const state = createInitialAppState();

    const next = appReducer(state, { type: 'SET_WORKFLOW_STEP', payload: 'resume' });

    expect(next.workflow.currentStepId).toBe('resume');
  });
});
