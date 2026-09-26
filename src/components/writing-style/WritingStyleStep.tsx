import { useAppState } from '../../state/AppContext';
import { WritingStyleForm } from './WritingStyleForm';

const DEFAULT_WRITING_STYLE = { mode: 'unspecified' as const, notes: undefined };

/**
 * Content for the "Writing Style" workflow step (plan.md Stage 7).
 *
 * Writing Style is optional and has no LLM call of its own: it simply
 * records the user's preference (or lack thereof) into application
 * state so it is available to the Resume/Cover Letter generation
 * prompts in later stages.
 */
export function WritingStyleStep() {
  const { state, dispatch } = useAppState();
  const writingStyle = state.writingStyle ?? DEFAULT_WRITING_STYLE;

  return (
    <div className="writing-style-step">
      <h2>Writing Style</h2>
      <p>
        Optionally describe how you&rsquo;d like your Resume and Cover Letter to sound. You can
        leave this blank and continue &mdash; a reasonable style will be inferred later.
      </p>
      <WritingStyleForm
        writingStyle={writingStyle}
        onChange={(next) => dispatch({ type: 'SET_WRITING_STYLE', payload: next })}
      />
    </div>
  );
}
