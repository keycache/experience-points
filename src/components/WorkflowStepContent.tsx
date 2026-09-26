import { getWorkflowStep } from '../app/workflow';
import { ConfigureStep } from './settings/ConfigureStep';
import { CareerProfileStep } from './career-profile/CareerProfileStep';
import { JobDescriptionStep } from './job-description/JobDescriptionStep';
import { WritingStyleStep } from './writing-style/WritingStyleStep';
import { MatchTailorStep } from './matching/MatchTailorStep';
import { ResumeStep } from './resume/ResumeStep';

interface WorkflowStepContentProps {
  stepId: string;
}

/**
 * Renders content for the active workflow step.
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

  if (step.id === 'configure') {
    return <ConfigureStep />;
  }

  if (step.id === 'career-profile') {
    return <CareerProfileStep />;
  }

  if (step.id === 'job-description') {
    return <JobDescriptionStep />;
  }

  if (step.id === 'writing-style') {
    return <WritingStyleStep />;
  }

  if (step.id === 'match-tailor') {
    return <MatchTailorStep />;
  }

  if (step.id === 'resume') {
    return <ResumeStep />;
  }

  return (
    <div className="workflow-step">
      <h2>{step.label}</h2>
      <p>This section will be implemented in a later stage.</p>
    </div>
  );
}
