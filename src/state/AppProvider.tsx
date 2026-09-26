import { useReducer, type ReactNode } from 'react';
import { AppContext } from './AppContext';
import { createInitialAppState } from './AppState';
import { appReducer } from './reducers/appReducer';

interface AppProviderProps {
  children: ReactNode;
}

/**
 * Provides the application's single in-memory session state to the
 * component tree.
 *
 * This state is intentionally not connected to any persistence
 * mechanism (localStorage, sessionStorage, IndexedDB, cookies, or URL
 * parameters). Unmounting/remounting this provider (e.g. a page
 * refresh in a real browser) discards the session, including the LLM
 * API key. See specification.md sections 2.1 and 18.
 */
export function AppProvider({ children }: AppProviderProps) {
  const [state, dispatch] = useReducer(appReducer, undefined, createInitialAppState);

  return <AppContext.Provider value={{ state, dispatch }}>{children}</AppContext.Provider>;
}
