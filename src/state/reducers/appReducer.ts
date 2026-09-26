import { createInitialAppState, type AppState } from '../AppState';
import type { AppAction } from '../actions';

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_LLM_SETTINGS':
      return { ...state, llm: { ...state.llm, ...action.payload } };
    case 'SET_CAREER_PROFILE':
      return { ...state, careerProfile: action.payload };
    case 'SET_JOB_DESCRIPTION':
      return { ...state, jobDescription: action.payload };
    case 'SET_WRITING_STYLE':
      return { ...state, writingStyle: action.payload };
    case 'SET_MATCHING':
      return { ...state, matching: action.payload };
    case 'SET_RESUME':
      return { ...state, resume: action.payload };
    case 'SET_WORKFLOW_STEP':
      return { ...state, workflow: { currentStepId: action.payload } };
    case 'CLEAR_SESSION':
      return createInitialAppState();
    default:
      return state;
  }
}
