interface StringListEditorProps {
  legend: string;
  items: string[];
  onChange: (items: string[]) => void;
  addButtonLabel: string;
  itemLabel: (index: number) => string;
  emptyMessage?: string;
}

/**
 * Add/edit/delete editor for a plain `string[]` field (e.g. Job
 * Description requirements/responsibilities/technologies). Each item
 * is an independently editable text input, rather than a single
 * comma-separated field, so a single entry can be edited or removed
 * without retyping the whole list.
 */
export function StringListEditor({
  legend,
  items,
  onChange,
  addButtonLabel,
  itemLabel,
  emptyMessage = 'None added yet.',
}: StringListEditorProps) {
  function updateAt(index: number, value: string) {
    const next = items.slice();
    next[index] = value;
    onChange(next);
  }

  function deleteAt(index: number) {
    onChange(items.filter((_, i) => i !== index));
  }

  function add() {
    onChange([...items, '']);
  }

  const idPrefix = legend.toLowerCase().replace(/[^a-z0-9]+/g, '-');

  return (
    <fieldset className="list-editor">
      <legend>{legend}</legend>
      {items.length === 0 && <p className="list-editor__empty">{emptyMessage}</p>}
      {items.map((item, index) => {
        const label = itemLabel(index);
        return (
          <div key={index} role="group" aria-label={label} className="string-list-editor__row">
            <label htmlFor={`${idPrefix}-${index}`}>{label}</label>
            <input
              id={`${idPrefix}-${index}`}
              type="text"
              value={item}
              onChange={(event) => updateAt(index, event.target.value)}
            />
            <button type="button" onClick={() => deleteAt(index)}>
              Delete {label}
            </button>
          </div>
        );
      })}
      <button type="button" onClick={add}>
        {addButtonLabel}
      </button>
    </fieldset>
  );
}
