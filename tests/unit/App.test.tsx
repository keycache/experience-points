import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '../../src/app/App';

describe('App', () => {
  it('mounts successfully and shows the application heading', () => {
    render(<App />);

    expect(
      screen.getByRole('heading', { name: /resume tailoring workbench/i }),
    ).toBeInTheDocument();
  });

  it('shows the default workflow step content on first render', () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: /configure/i })).toBeInTheDocument();
  });
});
