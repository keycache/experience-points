import { StringListEditor } from '../common/StringListEditor';

interface ResumeSkillsEditorProps {
  skills: string[];
  onChange: (skills: string[]) => void;
}

/** Editor for the Resume's Skills list. Plan.md Stage 10. */
export function ResumeSkillsEditor({ skills, onChange }: ResumeSkillsEditorProps) {
  return (
    <StringListEditor
      legend="Skills"
      items={skills}
      onChange={onChange}
      addButtonLabel="Add skill"
      itemLabel={(index) => `Skill ${index + 1}`}
    />
  );
}
