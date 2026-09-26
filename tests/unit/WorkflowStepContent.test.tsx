import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WorkflowStepContent } from '../../src/components/WorkflowStepContent';
import { AppProvider } from '../../src/state/AppProvider';

describe('WorkflowStepContent', () => {
  it('renders content for a known workflow step', () => {
    render(
      <AppProvider>
        <WorkflowStepContent stepId="resume" />
      </AppProvider>,
    );

    expect(screen.getByRole('heading', { name: /resume/i })).toBeInTheDocument();
  });

  it('does not crash and shows a readable fallback for an unknown workflow step', () => {
    expect(() =>
      render(
        <AppProvider>
          <WorkflowStepContent stepId="not-a-real-step" />
        </AppProvider>,
      ),
    ).not.toThrow();

    expect(screen.getByRole('alert')).toHaveTextContent(/not recognized/i);
  });
});
