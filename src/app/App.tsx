import { useState } from 'react';
import { WorkflowNav } from '../components/WorkflowNav';
import { WorkflowStepContent } from '../components/WorkflowStepContent';
import { SchemaPlayground } from '../components/dev/SchemaPlayground';
import {
  DEFAULT_WORKFLOW_STEP_ID,
  WORKFLOW_STEPS,
  type WorkflowStepId,
} from './workflow';
import '../styles/app.css';

export function App() {
  const [currentStepId, setCurrentStepId] = useState<WorkflowStepId>(
    DEFAULT_WORKFLOW_STEP_ID,
  );

  return (
    <div className="app-shell">
      <header className="app-shell__header">
        <h1>Resume Tailoring Workbench</h1>
        <p className="app-shell__tagline">
          A client-side-only resume tailoring workbench. No account, no
          backend &mdash; your data stays in this browser session.
        </p>
      </header>

      <WorkflowNav
        steps={WORKFLOW_STEPS}
        currentStepId={currentStepId}
        onSelect={(stepId) => setCurrentStepId(stepId as WorkflowStepId)}
      />

      <main className="app-shell__main">
        <WorkflowStepContent stepId={currentStepId} />
      </main>

      <SchemaPlayground />
    </div>
  );
}

export default App;
