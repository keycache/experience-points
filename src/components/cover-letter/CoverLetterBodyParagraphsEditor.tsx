import { MAX_COVER_LETTER_BODY_PARAGRAPHS } from '../../schemas/coverLetter';

interface CoverLetterBodyParagraphsEditorProps {
  paragraphs: string[];
  onChange: (paragraphs: string[]) => void;
}

/**
 * Editor for the Cover Letter's `bodyParagraphs` (plan.md Stage 14.5).
 *
 * Modeled on `StringListEditor` (used elsewhere for plain `string[]`
 * fields) but using a `<textarea>` per paragraph rather than a
 * single-line `<input>`, since a cover letter paragraph is
 * multi-sentence prose, not a short label. The list is capped at
 * `MAX_COVER_LETTER_BODY_PARAGRAPHS` (the "Add paragraph" button is
 * disabled, not hidden, once the cap is reached) so the UI cannot
 * produce a schema-invalid cover letter via manual editing — the same
 * `maxItems` pattern `ListEditor` uses for Resume bullets.
 */
export function CoverLetterBodyParagraphsEditor({
  paragraphs,
  onChange,
}: CoverLetterBodyParagraphsEditorProps) {
  function updateAt(index: number, value: string) {
    const next = paragraphs.slice();
    next[index] = value;
    onChange(next);
  }

  function deleteAt(index: number) {
    onChange(paragraphs.filter((_, i) => i !== index));
  }

  function moveUp(index: number) {
    if (index === 0) {
      return;
    }
    const next = paragraphs.slice();
    [next[index - 1], next[index]] = [next[index], next[index - 1]];
    onChange(next);
  }

  function moveDown(index: number) {
    if (index === paragraphs.length - 1) {
      return;
    }
    const next = paragraphs.slice();
    [next[index], next[index + 1]] = [next[index + 1], next[index]];
    onChange(next);
  }

  function add() {
    onChange([...paragraphs, '']);
  }

  const atMax = paragraphs.length >= MAX_COVER_LETTER_BODY_PARAGRAPHS;

  return (
    <fieldset className="list-editor">
      <legend>Body paragraphs</legend>
      {paragraphs.length === 0 && <p className="list-editor__empty">None added yet.</p>}
      {paragraphs.map((paragraph, index) => {
        const label = `Paragraph ${index + 1}`;
        return (
          <div key={index} role="group" aria-label={label} className="string-list-editor__row">
            <label htmlFor={`cover-letter-paragraph-${index}`}>{label}</label>
            <textarea
              id={`cover-letter-paragraph-${index}`}
              rows={3}
              value={paragraph}
              onChange={(event) => updateAt(index, event.target.value)}
            />
            <button type="button" onClick={() => moveUp(index)} disabled={index === 0}>
              Move {label} up
            </button>
            <button
              type="button"
              onClick={() => moveDown(index)}
              disabled={index === paragraphs.length - 1}
            >
              Move {label} down
            </button>
            <button type="button" onClick={() => deleteAt(index)}>
              Delete {label}
            </button>
          </div>
        );
      })}
      <button type="button" onClick={add} disabled={atMax}>
        Add paragraph
      </button>
      {atMax && (
        <p className="list-editor__empty">
          A cover letter must stay short: at most {MAX_COVER_LETTER_BODY_PARAGRAPHS} paragraphs.
        </p>
      )}
    </fieldset>
  );
}
