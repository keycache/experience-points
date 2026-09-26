import type { CareerProfile } from '../../schemas/careerProfile';
import { PersonalFieldsEditor } from './PersonalFieldsEditor';
import { ExperienceEditor } from './ExperienceEditor';
import { SkillsEditor } from './SkillsEditor';
import { ProjectsEditor } from './ProjectsEditor';
import {
  AwardsEditor,
  CertificationsEditor,
  CustomSectionsEditor,
  EducationEditor,
  ProfessionalAffiliationsEditor,
  PublicationsEditor,
  VolunteerExperienceEditor,
} from './OtherSectionEditors';

interface CareerProfileEditorProps {
  profile: CareerProfile;
  onChange: (profile: CareerProfile) => void;
}

/**
 * Full structured Career Profile editor (plan.md Stage 5).
 *
 * Purely a controlled component: it holds no state of its own and
 * calls `onChange` with the complete next `CareerProfile` on every
 * edit. The caller (`CareerProfileStep`) is responsible for persisting
 * the result into application state.
 */
export function CareerProfileEditor({ profile, onChange }: CareerProfileEditorProps) {
  function updateField<K extends keyof CareerProfile>(key: K, value: CareerProfile[K]) {
    onChange({ ...profile, [key]: value });
  }

  return (
    <div className="career-profile-editor">
      <PersonalFieldsEditor
        personal={profile.personal}
        onChange={(personal) => updateField('personal', personal)}
      />
      <ExperienceEditor
        experience={profile.experience}
        onChange={(experience) => updateField('experience', experience)}
      />
      <SkillsEditor skills={profile.skills} onChange={(skills) => updateField('skills', skills)} />
      <ProjectsEditor
        legend="Projects (standalone)"
        idPrefix="standalone"
        projects={profile.projects}
        onChange={(projects) => updateField('projects', projects)}
      />
      <EducationEditor
        education={profile.education}
        onChange={(education) => updateField('education', education)}
      />
      <CertificationsEditor
        certifications={profile.certifications}
        onChange={(certifications) => updateField('certifications', certifications)}
      />
      <AwardsEditor awards={profile.awards} onChange={(awards) => updateField('awards', awards)} />
      <PublicationsEditor
        publications={profile.publications}
        onChange={(publications) => updateField('publications', publications)}
      />
      <VolunteerExperienceEditor
        volunteerExperience={profile.volunteerExperience}
        onChange={(volunteerExperience) => updateField('volunteerExperience', volunteerExperience)}
      />
      <ProfessionalAffiliationsEditor
        professionalAffiliations={profile.professionalAffiliations}
        onChange={(professionalAffiliations) =>
          updateField('professionalAffiliations', professionalAffiliations)
        }
      />
      <CustomSectionsEditor
        customSections={profile.customSections}
        onChange={(customSections) => updateField('customSections', customSections)}
      />
    </div>
  );
}
