import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WorkflowStepContent } from '../../src/components/WorkflowStepContent';

describe('WorkflowStepContent', () => {
  it('renders content for a known workflow step', () => {
    render(<WorkflowStepContent stepId="resume" />);

    expect(screen.getByRole('heading', { name: /resume/i })).toBeInTheDocument();
  });

  it('does not crash and shows a readable fallback for an unknown workflow step', () => {
    expect(() =>
      render(<WorkflowStepContent stepId="not-a-real-step" />),
    ).not.toThrow();

    expect(screen.getByRole('alert')).toHaveTextContent(/not recognized/i);
  });
});
