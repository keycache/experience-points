export {};

// `@types/jest-axe` only augments Jest's `jest.Matchers` namespace, not
// Vitest's own `Assertion` interface, so `toHaveNoViolations()` needs
// its own Vitest-specific type augmentation (plan.md Stage 16). Kept
// in a `.d.ts` file (skipped by `skipLibCheck`) rather than a plain
// `.ts` file, since Vitest's own `Assertion<R, T>` generic parameter
// list is an internal implementation detail that regular type
// checking would otherwise require to match exactly (TS2428).
declare module 'vitest' {
  interface Assertion {
    toHaveNoViolations(): void;
  }
}
