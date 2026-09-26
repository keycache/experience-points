import type { CareerProfile } from '../schemas/careerProfile';
import type { JobDescription } from '../schemas/jobDescription';
import type { WritingStyle } from '../schemas/writingStyle';
import type { MatchingAnalysis } from '../schemas/matching';
import type { Resume } from '../schemas/resume';
import type { WorkflowStepId } from '../app/workflow';
import type { LLMSettings } from './AppState';

export type AppAction =
  | { type: 'SET_LLM_SETTINGS'; payload: Partial<LLMSettings> }
  | { type: 'SET_CAREER_PROFILE'; payload: CareerProfile | undefined }
  | { type: 'SET_JOB_DESCRIPTION'; payload: JobDescription | undefined }
  | { type: 'SET_WRITING_STYLE'; payload: WritingStyle | undefined }
  | { type: 'SET_MATCHING'; payload: MatchingAnalysis | undefined }
  | { type: 'SET_RESUME'; payload: Resume | undefined }
  | { type: 'SET_WORKFLOW_STEP'; payload: WorkflowStepId }
  /**
   * Resets the entire session to its initial state, including clearing
   * the LLM API key. See specification.md section 18 (Security and
   * Privacy).
   */
  | { type: 'CLEAR_SESSION' };
