import type { Skill } from '../../schemas/careerProfile';
import { ListEditor } from './ListEditor';
import { LabeledTextField } from './fields';

interface SkillsEditorProps {
  skills: Skill[];
  onChange: (skills: Skill[]) => void;
}

export function SkillsEditor({ skills, onChange }: SkillsEditorProps) {
  return (
    <ListEditor<Skill>
      legend="Skills"
      items={skills}
      onChange={onChange}
      createItem={() => ({ name: '', category: undefined })}
      itemLabel={(index) => `Skill ${index + 1}`}
      addButtonLabel="Add skill"
      renderFields={(item, onUpdate) => (
        <>
          <LabeledTextField
            id={`skill-${item.id}-name`}
            label="Name"
            value={item.name}
            onChange={(name) => onUpdate({ name })}
          />
          <LabeledTextField
            id={`skill-${item.id}-category`}
            label="Category"
            value={item.category ?? ''}
            onChange={(category) => onUpdate({ category: category || undefined })}
          />
        </>
      )}
    />
  );
}
