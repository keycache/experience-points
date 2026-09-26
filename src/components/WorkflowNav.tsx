import type { WorkflowStep } from '../app/workflow';

interface WorkflowNavProps {
  steps: readonly WorkflowStep[];
  currentStepId: string;
  onSelect: (stepId: string) => void;
}

/**
 * Top-level workflow navigation. Renders each known workflow step as a
 * button and marks the currently active step for sighted and
 * screen-reader users alike.
 */
export function WorkflowNav({ steps, currentStepId, onSelect }: WorkflowNavProps) {
  return (
    <nav aria-label="Workflow steps" className="workflow-nav">
      <ol>
        {steps.map((step) => {
          const isActive = step.id === currentStepId;
          return (
            <li key={step.id}>
              <button
                type="button"
                aria-current={isActive ? 'step' : undefined}
                className={isActive ? 'workflow-nav__step workflow-nav__step--active' : 'workflow-nav__step'}
                onClick={() => onSelect(step.id)}
              >
                {step.label}
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
