import { WorkflowNav } from '../components/WorkflowNav';
import { WorkflowStepContent } from '../components/WorkflowStepContent';
import { SchemaPlayground } from '../components/dev/SchemaPlayground';
import { AppProvider } from '../state/AppProvider';
import { useAppState } from '../state/AppContext';
import { WORKFLOW_STEPS, type WorkflowStepId } from './workflow';
import '../styles/app.css';

function AppShell() {
  const { state, dispatch } = useAppState();
  const currentStepId = state.workflow.currentStepId;

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
        onSelect={(stepId) =>
          dispatch({ type: 'SET_WORKFLOW_STEP', payload: stepId as WorkflowStepId })
        }
      />

      <main className="app-shell__main">
        <WorkflowStepContent stepId={currentStepId} />
      </main>

      <SchemaPlayground />
    </div>
  );
}

export function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}

export default App;
