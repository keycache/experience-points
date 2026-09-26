import type { Resume } from '../../schemas/resume';
import { ResumeHeaderEditor } from './ResumeHeaderEditor';
import { ResumeSummaryEditor } from './ResumeSummaryEditor';
import { ResumeSkillsEditor } from './ResumeSkillsEditor';
import { ResumeExperienceEditor } from './ResumeExperienceEditor';
import {
  ResumeAwardsEditor,
  ResumeCertificationsEditor,
  ResumeCustomSectionsEditor,
  ResumeEducationEditor,
  ResumeProfessionalAffiliationsEditor,
  ResumeProjectsEditor,
  ResumePublicationsEditor,
  ResumeVolunteerExperienceEditor,
} from './ResumeOtherSectionEditors';

interface ResumeEditorProps {
  resume: Resume;
  onChange: (resume: Resume) => void;
}

/**
 * Full structured Resume editor (plan.md Stage 10).
 *
 * Purely a controlled component, mirroring the Career Profile editor
 * pattern from Stage 5: no local state, calls `onChange` with the
 * complete next `Resume` on every edit. Editing here never touches
 * `state.careerProfile` — the caller (`ResumeStep`) only dispatches
 * `SET_RESUME`.
 */
export function ResumeEditor({ resume, onChange }: ResumeEditorProps) {
  function updateField<K extends keyof Resume>(key: K, value: Resume[K]) {
    onChange({ ...resume, [key]: value });
  }

  return (
    <div className="resume-editor">
      <ResumeHeaderEditor contact={resume.contact} onChange={(contact) => updateField('contact', contact)} />
      <ResumeSummaryEditor
        profileSummary={resume.profileSummary ?? ''}
        onChange={(profileSummary) => updateField('profileSummary', profileSummary || undefined)}
      />
      <ResumeSkillsEditor skills={resume.skills} onChange={(skills) => updateField('skills', skills)} />
      <ResumeExperienceEditor
        experience={resume.experience}
        onChange={(experience) => updateField('experience', experience)}
      />
      <ResumeEducationEditor
        education={resume.education}
        onChange={(education) => updateField('education', education)}
      />
      <ResumeCertificationsEditor
        certifications={resume.certifications}
        onChange={(certifications) => updateField('certifications', certifications)}
      />
      <ResumeProjectsEditor
        projects={resume.projects}
        onChange={(projects) => updateField('projects', projects)}
      />
      <ResumeAwardsEditor awards={resume.awards} onChange={(awards) => updateField('awards', awards)} />
      <ResumePublicationsEditor
        publications={resume.publications}
        onChange={(publications) => updateField('publications', publications)}
      />
      <ResumeVolunteerExperienceEditor
        volunteerExperience={resume.volunteerExperience}
        onChange={(volunteerExperience) => updateField('volunteerExperience', volunteerExperience)}
      />
      <ResumeProfessionalAffiliationsEditor
        professionalAffiliations={resume.professionalAffiliations}
        onChange={(professionalAffiliations) =>
          updateField('professionalAffiliations', professionalAffiliations)
        }
      />
      <ResumeCustomSectionsEditor
        customSections={resume.customSections}
        onChange={(customSections) => updateField('customSections', customSections)}
      />
    </div>
  );
}
