import type { z } from 'zod';

/**
 * Formats Zod validation issues as short, readable strings (e.g.
 * `"personal.fullName: Invalid input: expected string, received
 * undefined"`), suitable for direct display in the UI.
 */
export function formatZodIssues(error: z.ZodError): string[] {
  return error.issues.map((issue) => {
    const path = issue.path.length > 0 ? issue.path.join('.') : '(root)';
    return `${path}: ${issue.message}`;
  });
}
