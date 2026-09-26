import { LabeledTextField } from '../career-profile/fields';

interface ResumeSummaryEditorProps {
  profileSummary: string;
  onChange: (profileSummary: string) => void;
}

/** Editor for the Resume's Profile Summary. Plan.md Stage 10. */
export function ResumeSummaryEditor({ profileSummary, onChange }: ResumeSummaryEditorProps) {
  return (
    <fieldset className="list-editor">
      <legend>Profile summary</legend>
      <LabeledTextField
        id="resume-profile-summary"
        label="Profile summary"
        multiline
        value={profileSummary}
        onChange={onChange}
      />
    </fieldset>
  );
}
