/**
 * Defines the primary application workflow steps.
 *
 * See specification.md section 12 (Workflow) for the full pipeline this
 * navigation represents.
 */
export interface WorkflowStep {
  id: string;
  label: string;
}

export const WORKFLOW_STEPS: readonly WorkflowStep[] = [
  { id: 'configure', label: 'Configure' },
  { id: 'career-profile', label: 'Career Profile' },
  { id: 'job-description', label: 'Job Description' },
  { id: 'match-tailor', label: 'Match & Tailor' },
  { id: 'resume', label: 'Resume' },
  { id: 'cover-letter', label: 'Cover Letter' },
  { id: 'preview-export', label: 'Preview / Export' },
] as const;

export type WorkflowStepId = (typeof WORKFLOW_STEPS)[number]['id'];

export const DEFAULT_WORKFLOW_STEP_ID: WorkflowStepId = WORKFLOW_STEPS[0].id;

export function isKnownWorkflowStepId(id: string): id is WorkflowStepId {
  return WORKFLOW_STEPS.some((step) => step.id === id);
}

export function getWorkflowStep(id: string): WorkflowStep | undefined {
  return WORKFLOW_STEPS.find((step) => step.id === id);
}
