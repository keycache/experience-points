import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppProvider } from '../../../../src/state/AppProvider';
import { WorkflowStepContent } from '../../../../src/components/WorkflowStepContent';
import { GenerationErrorAlert } from '../../../../src/components/common/GenerationErrorAlert';
import { LLMAuthenticationError, LLMNetworkError } from '../../../../src/clients/llm/types';

/**
 * Unit-level tests for the shared `GenerationErrorAlert` (plan.md
 * Stage 15). Rendered inside `AppProvider` + a real `WorkflowStepContent`
 * (rather than in total isolation) because the component itself calls
 * `useAppState()` to dispatch a workflow-step change when "Update API
 * Key" is clicked, and needs the Configure step's real API key input
 * (`#llm-api-key-input`) to exist somewhere in the tree to focus.
 */
function renderWithConfigureStep(ui: React.ReactNode) {
  return render(
    <AppProvider>
      <WorkflowStepContent stepId="configure" />
      {ui}
    </AppProvider>,
  );
}

describe('GenerationErrorAlert', () => {
  it('renders the message and a Retry button that calls onRetry', async () => {
    const onRetry = vi.fn();
    const user = userEvent.setup();
    renderWithConfigureStep(
      <GenerationErrorAlert error={new Error('Something failed.')} message="Something failed." onRetry={onRetry} />,
    );

    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('Something failed.');

    await user.click(screen.getByRole('button', { name: /^retry$/i }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('does not show an Update API Key button for a non-authentication error', () => {
    renderWithConfigureStep(
      <GenerationErrorAlert error={new LLMNetworkError()} message="Network error." onRetry={vi.fn()} />,
    );

    expect(screen.queryByRole('button', { name: /update api key/i })).not.toBeInTheDocument();
  });

  it('shows an Update API Key button for an authentication error, which switches to Configure and focuses the API key field', async () => {
    const user = userEvent.setup();
    renderWithConfigureStep(
      <GenerationErrorAlert
        error={new LLMAuthenticationError()}
        message="Authentication failed."
        onRetry={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('button', { name: /update api key/i }));

    await waitFor(() => {
      expect(document.getElementById('llm-api-key-input')).toHaveFocus();
    });
  });

  it('accepts a custom retry label', () => {
    renderWithConfigureStep(
      <GenerationErrorAlert
        error={new Error('x')}
        message="x"
        onRetry={vi.fn()}
        retryLabel="Try again"
      />,
    );

    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });
});
