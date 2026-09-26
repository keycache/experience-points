import type { ContactInfo, Link } from '../../schemas/common';
import { ListEditor } from './ListEditor';
import { LabeledTextField } from './fields';

/**
 * `Link` has no `id` field of its own (it is only ever stored inline
 * within `ContactInfo.otherLinks`), but `ListEditor` requires one for
 * React keys/targeted updates. A synthetic index-based id is derived
 * on render and stripped back out again in `onChange` below.
 */
type LinkWithId = Link & { id: string };

interface PersonalFieldsEditorProps {
  personal: ContactInfo;
  onChange: (personal: ContactInfo) => void;
}

/** Editor for the Career Profile's `personal` contact information. */
export function PersonalFieldsEditor({ personal, onChange }: PersonalFieldsEditorProps) {
  function updateField<K extends keyof ContactInfo>(key: K, value: ContactInfo[K]) {
    onChange({ ...personal, [key]: value });
  }

  return (
    <fieldset className="list-editor">
      <legend>Personal</legend>
      <LabeledTextField
        id="personal-full-name"
        label="Full name"
        value={personal.fullName}
        onChange={(fullName) => updateField('fullName', fullName)}
      />
      <LabeledTextField
        id="personal-location"
        label="Location"
        value={personal.location ?? ''}
        onChange={(location) => updateField('location', location || undefined)}
      />
      <LabeledTextField
        id="personal-email"
        label="Email"
        type="email"
        value={personal.email ?? ''}
        onChange={(email) => updateField('email', email || undefined)}
      />
      <LabeledTextField
        id="personal-phone"
        label="Phone"
        type="tel"
        value={personal.phone ?? ''}
        onChange={(phone) => updateField('phone', phone || undefined)}
      />
      <LabeledTextField
        id="personal-website"
        label="Website"
        type="url"
        value={personal.website ?? ''}
        onChange={(website) => updateField('website', website || undefined)}
      />
      <LabeledTextField
        id="personal-github"
        label="GitHub"
        type="url"
        value={personal.github ?? ''}
        onChange={(github) => updateField('github', github || undefined)}
      />
      <LabeledTextField
        id="personal-linkedin"
        label="LinkedIn"
        type="url"
        value={personal.linkedin ?? ''}
        onChange={(linkedin) => updateField('linkedin', linkedin || undefined)}
      />
      <ListEditor<LinkWithId>
        legend="Other links"
        items={personal.otherLinks.map((link, index) => ({ ...link, id: `link-${index}` }))}
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
