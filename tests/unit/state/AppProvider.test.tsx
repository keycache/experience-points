import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AppProvider } from '../../../src/state/AppProvider';
import { useAppState } from '../../../src/state/AppContext';

function ReadApiKey() {
  const { state } = useAppState();
  return <output data-testid="api-key">{state.llm.apiKey}</output>;
}

describe('useAppState', () => {
  it('throws a helpful error when used outside an AppProvider', () => {
    // Suppress the expected React error boundary console noise for this
    // intentional misuse test.
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => render(<ReadApiKey />)).toThrow(/useAppState must be used within an AppProvider/);

    consoleError.mockRestore();
  });

  it('provides initial state with an empty API key', () => {
    render(
      <AppProvider>
        <ReadApiKey />
      </AppProvider>,
    );

    expect(screen.getByTestId('api-key')).toHaveTextContent('');
  });
});
