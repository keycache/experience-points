import type { ReactNode } from 'react';
import { generateId } from '../../utils/ids';

interface ListEditorProps<T extends { id: string }> {
  legend: string;
  items: T[];
  onChange: (items: T[]) => void;
  createItem: () => Omit<T, 'id'>;
  renderFields: (item: T, onUpdate: (patch: Partial<T>) => void) => ReactNode;
  itemLabel: (index: number) => string;
  addButtonLabel: string;
  deleteButtonLabel?: (index: number) => string;
  emptyMessage?: string;
  /** Caps the list size (e.g. Resume bullets, max 6). Omit for no limit. */
  maxItems?: number;
  addDisabledMessage?: string;
}

/**
 * Generic add/edit/delete/reorder list editor shared across every
 * repeatable Career Profile section (Experience, Projects,
 * Accomplishments, Skills, Education, Certifications, Awards,
 * Publications, Volunteer Experience, Professional Affiliations,
 * Custom Sections) and every repeatable Resume section (plan.md
 * Stage 5 and Stage 10).
 *
 * Each item is rendered inside a `role="group"` labeled with
 * `itemLabel(index)` so tests and assistive technology can scope
 * queries to a specific item even when multiple items share the same
 * field labels (e.g. every experience has a "Company" field).
 */
export function ListEditor<T extends { id: string }>({
  legend,
  items,
  onChange,
  createItem,
  renderFields,
  itemLabel,
  addButtonLabel,
  deleteButtonLabel,
  emptyMessage = 'None added yet.',
  maxItems,
  addDisabledMessage,
}: ListEditorProps<T>) {
  function updateAt(index: number, patch: Partial<T>) {
    const next = items.slice();
    next[index] = { ...next[index], ...patch };
    onChange(next);
  }

  function deleteAt(index: number) {
    onChange(items.filter((_, i) => i !== index));
  }

  function moveUp(index: number) {
    if (index === 0) {
      return;
    }
    const next = items.slice();
    [next[index - 1], next[index]] = [next[index], next[index - 1]];
    onChange(next);
  }

  function moveDown(index: number) {
    if (index === items.length - 1) {
      return;
    }
    const next = items.slice();
    [next[index], next[index + 1]] = [next[index + 1], next[index]];
    onChange(next);
  }

  function add() {
    onChange([...items, { ...createItem(), id: generateId() } as T]);
  }

  const atMaxItems = maxItems !== undefined && items.length >= maxItems;

  return (
    <fieldset className="list-editor">
      <legend>{legend}</legend>
      {items.length === 0 && <p className="list-editor__empty">{emptyMessage}</p>}
      {items.map((item, index) => {
        const label = itemLabel(index);
        return (
          <div key={item.id} role="group" aria-label={label} className="list-editor__item">
            {renderFields(item, (patch) => updateAt(index, patch))}
            <div className="list-editor__item-actions">
              <button type="button" onClick={() => moveUp(index)} disabled={index === 0}>
                Move {label} up
              </button>
              <button
                type="button"
                onClick={() => moveDown(index)}
                disabled={index === items.length - 1}
              >
                Move {label} down
              </button>
              <button type="button" onClick={() => deleteAt(index)}>
                {deleteButtonLabel ? deleteButtonLabel(index) : `Delete ${label}`}
              </button>
            </div>
          </div>
        );
      })}
      <button type="button" onClick={add} disabled={atMaxItems}>
        {addButtonLabel}
      </button>
      {atMaxItems && addDisabledMessage && (
        <p className="list-editor__empty">{addDisabledMessage}</p>
      )}
    </fieldset>
  );
}
