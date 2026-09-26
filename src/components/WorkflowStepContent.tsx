import { getWorkflowStep } from '../app/workflow';

interface WorkflowStepContentProps {
  stepId: string;
}

/**
 * Renders placeholder content for the active workflow step.
 *
 * If the current step id does not correspond to a known workflow step
 * (for example, because of a corrupted or future-versioned session
 * state), a readable fallback is shown instead of crashing the app.
 */
export function WorkflowStepContent({ stepId }: WorkflowStepContentProps) {
  const step = getWorkflowStep(stepId);

  if (!step) {
    return (
      <div role="alert" className="workflow-step workflow-step--unknown">
        <h2>Unsupported workflow step</h2>
        <p>
          This workflow step (&ldquo;{stepId}&rdquo;) is not recognized by this
          version of the application. Please choose a step from the
          navigation above.
        </p>
      </div>
    );
  }

  return (
    <div className="workflow-step">
      <h2>{step.label}</h2>
      <p>This section will be implemented in a later stage.</p>
    </div>
  );
}
