/**
 * Generates a short, sufficiently-unique id for client-side list items
 * (e.g. a new Experience/Project/Accomplishment the user adds, or a
 * freshly-generated Career Profile from the LLM — see
 * `assignFreshIds`). Not intended as a stable external identifier.
 */
export function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
