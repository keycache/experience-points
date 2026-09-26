import type { CareerProfile } from '../schemas/careerProfile';
import type { JobDescription } from '../schemas/jobDescription';
import type { WritingStyle } from '../schemas/writingStyle';
import type { MatchingAnalysis } from '../schemas/matching';
import type { Resume } from '../schemas/resume';
import { DEFAULT_WORKFLOW_STEP_ID, type WorkflowStepId } from '../app/workflow';

/**
 * LLM provider configuration.
 *
 * See specification.md section 6 (OpenRouter Configuration). The API
 * key lives only in this in-memory state; it must never be written to
 * a storage/persistence helper (see Security and Privacy, section 18).
 */
export interface LLMSettings {
  provider: 'openrouter';
  apiKey: string;
  model: string;
}

export interface WorkflowState {
  currentStepId: WorkflowStepId;
}

/**
 * The application's single in-memory session state.
 *
 * See specification.md section 7 (Application State). This state is
 * intentionally never connected to localStorage, sessionStorage,
 * IndexedDB, cookies, or URL parameters. A page refresh resets it; the
 * only persistence mechanism is explicit user export (Stage 3).
 */
export interface AppState {
  llm: LLMSettings;
  careerProfile?: CareerProfile;
  jobDescription?: JobDescription;
  writingStyle?: WritingStyle;
  matching?: MatchingAnalysis;
  resume?: Resume;
  workflow: WorkflowState;
}

export function createInitialAppState(): AppState {
  return {
    llm: { provider: 'openrouter', apiKey: '', model: '' },
    workflow: { currentStepId: DEFAULT_WORKFLOW_STEP_ID },
  };
}
