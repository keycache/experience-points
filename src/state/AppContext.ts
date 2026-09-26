import { createContext, useContext, type Dispatch } from 'react';
import type { AppState } from './AppState';
import type { AppAction } from './actions';

export interface AppContextValue {
  state: AppState;
  dispatch: Dispatch<AppAction>;
}

export const AppContext = createContext<AppContextValue | undefined>(undefined);

/**
 * Access the application's single in-memory session state and its
 * dispatch function. Must be called from within an `AppProvider`.
 */
export function useAppState(): AppContextValue {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppState must be used within an AppProvider');
  }
  return context;
}
