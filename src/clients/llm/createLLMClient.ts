import type { LLMSettings } from '../../state/AppState';
import { OpenRouterClient } from './openrouter/OpenRouterClient';
import type { LLMClient } from './types';

/**
 * Creates an `LLMClient` for the currently configured provider.
 *
 * This is the only place in the application that should switch on
 * `LLMSettings.provider`. See specification.md section 5.3 (Future
 * providers): adding a new provider means adding a case here, not
 * modifying any career-profile/job-description/matching/resume/PDF
 * code.
 */
export function createLLMClient(settings: LLMSettings): LLMClient {
  switch (settings.provider) {
    case 'openrouter':
      return new OpenRouterClient(settings.apiKey);
    default: {
      const exhaustiveCheck: never = settings.provider;
      throw new Error(`Unsupported LLM provider: ${String(exhaustiveCheck)}`);
    }
  }
}
