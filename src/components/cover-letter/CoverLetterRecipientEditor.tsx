import type { CoverLetterRecipient } from '../../schemas/coverLetter';
import { LabeledTextField } from '../career-profile/fields';

interface CoverLetterRecipientEditorProps {
  recipient: CoverLetterRecipient | undefined;
  onChange: (recipient: CoverLetterRecipient | undefined) => void;
}

/**
 * Editor for the Cover Letter's optional `recipient` (hiring manager
 * name, company). Both fields are optional per specification.md
 * section 8.6, so an entirely-empty recipient collapses back to
 * `undefined` rather than persisting an empty object.
 */
export function CoverLetterRecipientEditor({ recipient, onChange }: CoverLetterRecipientEditorProps) {
  function updateField<K extends keyof CoverLetterRecipient>(key: K, value: CoverLetterRecipient[K]) {
    const next: CoverLetterRecipient = { ...recipient, [key]: value || undefined };
    const isEmpty = !next.hiringManagerName && !next.company;
    onChange(isEmpty ? undefined : next);
  }

  return (
    <fieldset className="list-editor">
      <legend>Recipient (optional)</legend>
      <LabeledTextField
        id="cover-letter-recipient-hiring-manager-name"
        label="Hiring manager name"
        value={recipient?.hiringManagerName ?? ''}
        onChange={(value) => updateField('hiringManagerName', value)}
      />
      <LabeledTextField
        id="cover-letter-recipient-company"
        label="Company"
        value={recipient?.company ?? ''}
        onChange={(value) => updateField('company', value)}
      />
    </fieldset>
  );
}
