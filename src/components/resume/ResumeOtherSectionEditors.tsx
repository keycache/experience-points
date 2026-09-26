import type {
  ResumeAward,
  ResumeCertification,
  ResumeCustomSection,
  ResumeEducation,
  ResumeProfessionalAffiliation,
  ResumeProject,
  ResumePublication,
  ResumeVolunteerExperience,
} from '../../schemas/resume';
import { ListEditor } from '../career-profile/ListEditor';
import { LabeledTagsField, LabeledTextField } from '../career-profile/fields';
import { OptionalMonthYearFields } from '../career-profile/OptionalMonthYearFields';

/**
 * Add/edit/delete/reorder editors for the remaining Resume sections
 * (plan.md Stage 10): Education, Certifications, Projects, Awards,
 * Publications, Volunteer Experience, Professional Affiliations, and
 * Custom Sections. Mirrors the Career Profile's
 * `OtherSectionEditors.tsx`, but each editor here targets the
 * narrower Resume-specific schema for that section.
 */

export function ResumeEducationEditor({
  education,
  onChange,
}: {
  education: ResumeEducation[];
  onChange: (education: ResumeEducation[]) => void;
}) {
  return (
    <ListEditor<ResumeEducation>
      legend="Education"
      items={education}
      onChange={onChange}
      createItem={() => ({ institution: '' })}
      itemLabel={(index) => `Education ${index + 1}`}
      addButtonLabel="Add education"
      renderFields={(item, onUpdate) => {
        const idPrefix = `resume-education-${item.id}`;
        return (
          <>
            <LabeledTextField
              id={`${idPrefix}-institution`}
              label="Institution"
              value={item.institution}
              onChange={(institution) => onUpdate({ institution })}
            />
            <LabeledTextField
              id={`${idPrefix}-degree`}
              label="Degree"
              value={item.degree ?? ''}
              onChange={(degree) => onUpdate({ degree: degree || undefined })}
            />
            <LabeledTextField
              id={`${idPrefix}-field-of-study`}
              label="Field of study"
              value={item.fieldOfStudy ?? ''}
              onChange={(fieldOfStudy) => onUpdate({ fieldOfStudy: fieldOfStudy || undefined })}
            />
            <OptionalMonthYearFields
              idPrefix={`${idPrefix}-start`}
              monthLabel="Start month"
              yearLabel="Start year"
              value={item.startDate}
              onChange={(startDate) => onUpdate({ startDate })}
            />
            <OptionalMonthYearFields
              idPrefix={`${idPrefix}-end`}
              monthLabel="End month"
              yearLabel="End year"
              value={item.endDate}
              onChange={(endDate) => onUpdate({ endDate })}
            />
            <LabeledTextField
              id={`${idPrefix}-details`}
              label="Details"
              multiline
              value={item.details ?? ''}
              onChange={(details) => onUpdate({ details: details || undefined })}
            />
          </>
        );
      }}
    />
  );
}

export function ResumeCertificationsEditor({
  certifications,
  onChange,
}: {
  certifications: ResumeCertification[];
  onChange: (certifications: ResumeCertification[]) => void;
}) {
  return (
    <ListEditor<ResumeCertification>
      legend="Certifications"
      items={certifications}
      onChange={onChange}
      createItem={() => ({ name: '' })}
      itemLabel={(index) => `Certification ${index + 1}`}
      addButtonLabel="Add certification"
      renderFields={(item, onUpdate) => {
        const idPrefix = `resume-certification-${item.id}`;
        return (
          <>
            <LabeledTextField
              id={`${idPrefix}-name`}
              label="Name"
              value={item.name}
              onChange={(name) => onUpdate({ name })}
            />
            <LabeledTextField
              id={`${idPrefix}-issuer`}
              label="Issuer"
              value={item.issuer ?? ''}
              onChange={(issuer) => onUpdate({ issuer: issuer || undefined })}
            />
            <OptionalMonthYearFields
              idPrefix={`${idPrefix}-awarded`}
              monthLabel="Awarded month"
              yearLabel="Awarded year"
              value={item.dateAwarded}
              onChange={(dateAwarded) => onUpdate({ dateAwarded })}
            />
          </>
        );
      }}
    />
  );
}

export function ResumeProjectsEditor({
  projects,
  onChange,
}: {
  projects: ResumeProject[];
  onChange: (projects: ResumeProject[]) => void;
}) {
  return (
    <ListEditor<ResumeProject>
      legend="Projects"
      items={projects}
      onChange={onChange}
      createItem={() => ({ name: '', technologies: [] })}
      itemLabel={(index) => `Project ${index + 1}`}
      addButtonLabel="Add project"
      renderFields={(item, onUpdate) => {
        const idPrefix = `resume-project-${item.id}`;
        return (
          <>
            <LabeledTextField
              id={`${idPrefix}-name`}
              label="Name"
              value={item.name}
              onChange={(name) => onUpdate({ name })}
            />
            <LabeledTextField
              id={`${idPrefix}-description`}
              label="Description"
              multiline
              value={item.description ?? ''}
              onChange={(description) => onUpdate({ description: description || undefined })}
            />
            <LabeledTagsField
              id={`${idPrefix}-technologies`}
              label="Technologies"
              value={item.technologies}
              onChange={(technologies) => onUpdate({ technologies })}
            />
          </>
        );
      }}
    />
  );
}

export function ResumeAwardsEditor({
  awards,
  onChange,
}: {
  awards: ResumeAward[];
  onChange: (awards: ResumeAward[]) => void;
}) {
  return (
    <ListEditor<ResumeAward>
      legend="Awards"
      items={awards}
      onChange={onChange}
      createItem={() => ({ title: '' })}
      itemLabel={(index) => `Award ${index + 1}`}
      addButtonLabel="Add award"
      renderFields={(item, onUpdate) => {
        const idPrefix = `resume-award-${item.id}`;
        return (
          <>
            <LabeledTextField
              id={`${idPrefix}-title`}
              label="Title"
              value={item.title}
              onChange={(title) => onUpdate({ title })}
            />
            <LabeledTextField
              id={`${idPrefix}-issuer`}
              label="Issuer"
              value={item.issuer ?? ''}
              onChange={(issuer) => onUpdate({ issuer: issuer || undefined })}
            />
            <OptionalMonthYearFields
              idPrefix={`${idPrefix}-date`}
              monthLabel="Month"
              yearLabel="Year"
              value={item.date}
              onChange={(date) => onUpdate({ date })}
            />
          </>
        );
      }}
    />
  );
}

export function ResumePublicationsEditor({
  publications,
  onChange,
}: {
  publications: ResumePublication[];
  onChange: (publications: ResumePublication[]) => void;
}) {
  return (
    <ListEditor<ResumePublication>
      legend="Publications"
      items={publications}
      onChange={onChange}
      createItem={() => ({ title: '' })}
      itemLabel={(index) => `Publication ${index + 1}`}
      addButtonLabel="Add publication"
      renderFields={(item, onUpdate) => {
        const idPrefix = `resume-publication-${item.id}`;
        return (
          <>
            <LabeledTextField
              id={`${idPrefix}-title`}
              label="Title"
              value={item.title}
              onChange={(title) => onUpdate({ title })}
            />
            <LabeledTextField
              id={`${idPrefix}-publisher`}
              label="Publisher"
              value={item.publisher ?? ''}
              onChange={(publisher) => onUpdate({ publisher: publisher || undefined })}
            />
            <LabeledTextField
              id={`${idPrefix}-url`}
              label="URL"
              type="url"
              value={item.url ?? ''}
              onChange={(url) => onUpdate({ url: url || undefined })}
            />
          </>
        );
      }}
    />
  );
}

export function ResumeVolunteerExperienceEditor({
  volunteerExperience,
  onChange,
}: {
  volunteerExperience: ResumeVolunteerExperience[];
  onChange: (volunteerExperience: ResumeVolunteerExperience[]) => void;
}) {
  return (
    <ListEditor<ResumeVolunteerExperience>
      legend="Volunteer experience"
      items={volunteerExperience}
      onChange={onChange}
      createItem={() => ({ organization: '' })}
      itemLabel={(index) => `Volunteer experience ${index + 1}`}
      addButtonLabel="Add volunteer experience"
      renderFields={(item, onUpdate) => {
        const idPrefix = `resume-volunteer-${item.id}`;
        return (
          <>
            <LabeledTextField
              id={`${idPrefix}-organization`}
              label="Organization"
              value={item.organization}
              onChange={(organization) => onUpdate({ organization })}
            />
            <LabeledTextField
              id={`${idPrefix}-role`}
              label="Role"
              value={item.role ?? ''}
              onChange={(role) => onUpdate({ role: role || undefined })}
            />
            <LabeledTextField
              id={`${idPrefix}-description`}
              label="Description"
              multiline
              value={item.description ?? ''}
              onChange={(description) => onUpdate({ description: description || undefined })}
            />
          </>
        );
      }}
    />
  );
}

export function ResumeProfessionalAffiliationsEditor({
  professionalAffiliations,
  onChange,
}: {
  professionalAffiliations: ResumeProfessionalAffiliation[];
  onChange: (professionalAffiliations: ResumeProfessionalAffiliation[]) => void;
}) {
  return (
    <ListEditor<ResumeProfessionalAffiliation>
      legend="Professional affiliations"
      items={professionalAffiliations}
      onChange={onChange}
      createItem={() => ({ organization: '' })}
      itemLabel={(index) => `Professional affiliation ${index + 1}`}
      addButtonLabel="Add professional affiliation"
      renderFields={(item, onUpdate) => {
        const idPrefix = `resume-affiliation-${item.id}`;
        return (
          <>
            <LabeledTextField
              id={`${idPrefix}-organization`}
              label="Organization"
              value={item.organization}
              onChange={(organization) => onUpdate({ organization })}
            />
            <LabeledTextField
              id={`${idPrefix}-role`}
              label="Role"
              value={item.role ?? ''}
              onChange={(role) => onUpdate({ role: role || undefined })}
            />
          </>
        );
      }}
    />
  );
}

export function ResumeCustomSectionsEditor({
  customSections,
  onChange,
}: {
  customSections: ResumeCustomSection[];
  onChange: (customSections: ResumeCustomSection[]) => void;
}) {
  return (
    <ListEditor<ResumeCustomSection>
      legend="Custom sections"
      items={customSections}
      onChange={onChange}
      createItem={() => ({ title: '', content: '' })}
      itemLabel={(index) => `Custom section ${index + 1}`}
      addButtonLabel="Add custom section"
      renderFields={(item, onUpdate) => {
        const idPrefix = `resume-custom-section-${item.id}`;
        return (
          <>
            <LabeledTextField
              id={`${idPrefix}-title`}
              label="Title"
              value={item.title}
              onChange={(title) => onUpdate({ title })}
            />
            <LabeledTextField
              id={`${idPrefix}-content`}
              label="Content"
              multiline
              value={item.content}
              onChange={(content) => onUpdate({ content })}
            />
          </>
        );
      }}
    />
  );
}
