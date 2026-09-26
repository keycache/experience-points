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
}

/**
 * Generic add/edit/delete list editor shared across every repeatable
 * Career Profile section (Experience, Projects, Accomplishments,
 * Skills, Education, Certifications, Awards, Publications, Volunteer
 * Experience, Professional Affiliations, Custom Sections). See plan.md
 * Stage 5 and Stage 10 (which reuses the same pattern for the Resume).
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
}: ListEditorProps<T>) {
  function updateAt(index: number, patch: Partial<T>) {
    const next = items.slice();
    next[index] = { ...next[index], ...patch };
    onChange(next);
  }

  function deleteAt(index: number) {
    onChange(items.filter((_, i) => i !== index));
  }

  function add() {
    onChange([...items, { ...createItem(), id: generateId() } as T]);
  }

  return (
    <fieldset className="list-editor">
      <legend>{legend}</legend>
      {items.length === 0 && <p className="list-editor__empty">{emptyMessage}</p>}
      {items.map((item, index) => (
        <div key={item.id} role="group" aria-label={itemLabel(index)} className="list-editor__item">
          {renderFields(item, (patch) => updateAt(index, patch))}
          <button type="button" onClick={() => deleteAt(index)}>
            {deleteButtonLabel ? deleteButtonLabel(index) : `Delete ${itemLabel(index)}`}
          </button>
        </div>
      ))}
      <button type="button" onClick={add}>
        {addButtonLabel}
      </button>
    </fieldset>
  );
}
