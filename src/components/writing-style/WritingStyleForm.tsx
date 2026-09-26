import type { WritingStyle } from '../../schemas/writingStyle';
import { LabeledTextField } from '../career-profile/fields';

interface WritingStyleFormProps {
  writingStyle: WritingStyle;
  onChange: (writingStyle: WritingStyle) => void;
}

/**
 * Writing Style input form (plan.md Stage 7).
 *
 * Writing Style is optional: the "Unspecified" mode is a first-class,
 * valid choice, not a placeholder state. Switching modes preserves
 * whatever the user already typed in each mode so toggling back and
 * forth does not lose data.
 */
export function WritingStyleForm({ writingStyle, onChange }: WritingStyleFormProps) {
  function updateField<K extends keyof WritingStyle>(key: K, value: WritingStyle[K]) {
    onChange({ ...writingStyle, [key]: value });
  }

  return (
    <div className="writing-style-form">
      <fieldset className="list-editor">
        <legend>Writing style</legend>
        <div className="field-row">
          <label htmlFor="writing-style-mode">Mode</label>
          <select
            id="writing-style-mode"
            value={writingStyle.mode}
            onChange={(event) => updateField('mode', event.target.value as WritingStyle['mode'])}
          >
            <option value="unspecified">Unspecified (let the AI infer a style)</option>
            <option value="raw">Raw text</option>
            <option value="structured">Structured</option>
          </select>
        </div>

        {writingStyle.mode === 'unspecified' && (
          <p className="writing-style-form__hint">
            No style specified. When generating a Resume or Cover Letter, a reasonable style
            will be inferred from your Career Profile&rsquo;s experience, education, and any
            self-reference details you provided.
          </p>
        )}

        {writingStyle.mode === 'raw' && (
          <LabeledTextField
            id="writing-style-raw-text"
            label="Raw style guidance"
            multiline
            value={writingStyle.rawText ?? ''}
            onChange={(rawText) => updateField('rawText', rawText || undefined)}
            placeholder="e.g. Confident and concise, first-person, avoid buzzwords."
          />
        )}

        {writingStyle.mode === 'structured' && (
          <>
            <LabeledTextField
              id="writing-style-tone"
              label="Tone"
              value={writingStyle.tone ?? ''}
              onChange={(tone) => updateField('tone', tone || undefined)}
              placeholder="e.g. confident, warm, direct"
            />
            <div className="field-row">
              <label htmlFor="writing-style-voice">Voice</label>
              <select
                id="writing-style-voice"
                value={writingStyle.voice ?? ''}
                onChange={(event) =>
                  updateField(
                    'voice',
                    (event.target.value || undefined) as WritingStyle['voice'],
                  )
                }
              >
                <option value="">(no preference)</option>
                <option value="first-person">First person</option>
                <option value="third-person">Third person</option>
              </select>
            </div>
            <div className="field-row">
              <label htmlFor="writing-style-formality">Formality</label>
              <select
                id="writing-style-formality"
                value={writingStyle.formality ?? ''}
                onChange={(event) =>
                  updateField(
                    'formality',
                    (event.target.value || undefined) as WritingStyle['formality'],
                  )
                }
              >
                <option value="">(no preference)</option>
                <option value="casual">Casual</option>
                <option value="neutral">Neutral</option>
                <option value="formal">Formal</option>
              </select>
            </div>
            <LabeledTextField
              id="writing-style-notes"
              label="Additional notes"
              multiline
              value={writingStyle.notes ?? ''}
              onChange={(notes) => updateField('notes', notes || undefined)}
            />
          </>
        )}
      </fieldset>
    </div>
  );
}
