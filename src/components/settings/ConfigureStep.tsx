import { useAppState } from '../../state/AppContext';
import { LLMSettingsForm } from './LLMSettingsForm';
import { TestConnectionButton } from './TestConnectionButton';
import { PrivacyNotice } from '../common/PrivacyNotice';

/**
 * Content for the "Configure" workflow step.
 *
 * See plan.md Stage 2 (Session State and Privacy Boundary), Stage 4
 * (LLM Client Abstraction), and specification.md section 6 (OpenRouter
 * Configuration).
 */
export function ConfigureStep() {
  const { dispatch } = useAppState();

  return (
    <div className="configure-step">
      <h2>Configure</h2>
      <PrivacyNotice />
      <LLMSettingsForm />
      <TestConnectionButton />
      <button
        type="button"
        className="configure-step__clear-session"
        onClick={() => dispatch({ type: 'CLEAR_SESSION' })}
      >
        Clear session
      </button>
    </div>
  );
}
