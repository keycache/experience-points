import type { ContactInfo, Link } from '../../schemas/common';
import { ListEditor } from '../career-profile/ListEditor';
import { LabeledTextField } from '../career-profile/fields';

/**
 * `Link` has no `id` field of its own, but `ListEditor` requires one
 * for React keys/targeted updates. A synthetic index-based id is
 * derived on render and stripped back out again in `onChange` below
 * (same pattern as `PersonalFieldsEditor` for the Career Profile).
 */
type LinkWithId = Link & { id: string };

interface ResumeHeaderEditorProps {
  contact: ContactInfo;
  onChange: (contact: ContactInfo) => void;
}

/** Editor for the Resume's "Header" (contact information). Plan.md Stage 10. */
export function ResumeHeaderEditor({ contact, onChange }: ResumeHeaderEditorProps) {
  function updateField<K extends keyof ContactInfo>(key: K, value: ContactInfo[K]) {
    onChange({ ...contact, [key]: value });
  }

  return (
    <fieldset className="list-editor">
      <legend>Header</legend>
      <LabeledTextField
        id="resume-header-full-name"
        label="Full name"
        value={contact.fullName}
        onChange={(fullName) => updateField('fullName', fullName)}
      />
      <LabeledTextField
        id="resume-header-location"
        label="Location"
        value={contact.location ?? ''}
        onChange={(location) => updateField('location', location || undefined)}
      />
      <LabeledTextField
        id="resume-header-email"
        label="Email"
        type="email"
        value={contact.email ?? ''}
        onChange={(email) => updateField('email', email || undefined)}
      />
      <LabeledTextField
        id="resume-header-phone"
        label="Phone"
        type="tel"
        value={contact.phone ?? ''}
        onChange={(phone) => updateField('phone', phone || undefined)}
      />
      <LabeledTextField
        id="resume-header-website"
        label="Website"
        type="url"
        value={contact.website ?? ''}
        onChange={(website) => updateField('website', website || undefined)}
      />
      <LabeledTextField
        id="resume-header-github"
        label="GitHub"
        type="url"
        value={contact.github ?? ''}
        onChange={(github) => updateField('github', github || undefined)}
      />
      <LabeledTextField
        id="resume-header-linkedin"
        label="LinkedIn"
        type="url"
        value={contact.linkedin ?? ''}
        onChange={(linkedin) => updateField('linkedin', linkedin || undefined)}
      />
      <ListEditor<LinkWithId>
        legend="Other links"
        items={contact.otherLinks.map((link, index) => ({ ...link, id: `link-${index}` }))}
        onChange={(links) =>
          updateField(
            'otherLinks',
            links.map(({ label, url }) => ({ label, url })),
          )
        }
        createItem={() => ({ label: '', url: '' })}
        itemLabel={(index) => `Link ${index + 1}`}
        addButtonLabel="Add link"
        renderFields={(item, onUpdate) => (
          <>
            <LabeledTextField
              id={`${item.id}-label`}
              label="Label"
              value={item.label}
              onChange={(label) => onUpdate({ label })}
            />
            <LabeledTextField
              id={`${item.id}-url`}
              label="URL"
              type="url"
              value={item.url}
              onChange={(url) => onUpdate({ url })}
            />
          </>
        )}
      />
    </fieldset>
  );
}
