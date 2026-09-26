import type { ChangeEvent } from 'react';

interface LabeledTextFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
  type?: 'text' | 'email' | 'url' | 'tel';
}

/** A single labeled text/textarea input, used throughout the Career Profile editor. */
export function LabeledTextField({
  id,
  label,
  value,
  onChange,
  placeholder,
  multiline,
  type = 'text',
}: LabeledTextFieldProps) {
  function handleChange(event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    onChange(event.target.value);
  }

  return (
    <div className="field-row">
      <label htmlFor={id}>{label}</label>
      {multiline ? (
        <textarea id={id} value={value} onChange={handleChange} placeholder={placeholder} />
      ) : (
        <input id={id} type={type} value={value} onChange={handleChange} placeholder={placeholder} />
      )}
    </div>
  );
}

interface LabeledNumberFieldProps {
  id: string;
  label: string;
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  min?: number;
  max?: number;
}

export function LabeledNumberField({ id, label, value, onChange, min, max }: LabeledNumberFieldProps) {
  return (
    <div className="field-row">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        type="number"
        min={min}
        max={max}
        value={value ?? ''}
        onChange={(event) => {
          const raw = event.target.value;
          onChange(raw === '' ? undefined : Number(raw));
        }}
      />
    </div>
  );
}

interface LabeledCheckboxFieldProps {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function LabeledCheckboxField({ id, label, checked, onChange }: LabeledCheckboxFieldProps) {
  return (
    <div className="field-row field-row--checkbox">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <label htmlFor={id}>{label}</label>
    </div>
  );
}

interface LabeledTagsFieldProps {
  id: string;
  label: string;
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
}

/** Comma-separated free-form tags, used for `technologies` arrays. */
export function LabeledTagsField({ id, label, value, onChange, placeholder }: LabeledTagsFieldProps) {
  return (
    <div className="field-row">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        type="text"
        value={value.join(', ')}
        placeholder={placeholder}
        onChange={(event) =>
          onChange(
            event.target.value
              .split(',')
              .map((tag) => tag.trim())
              .filter((tag) => tag.length > 0),
          )
        }
      />
    </div>
  );
}
