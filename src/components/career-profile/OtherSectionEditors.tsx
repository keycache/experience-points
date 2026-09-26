import type {
  Award,
  Certification,
  CustomSection,
  Education,
  ProfessionalAffiliation,
  Publication,
  VolunteerExperience,
} from '../../schemas/careerProfile';
import { ListEditor } from './ListEditor';
import { LabeledTextField } from './fields';
import { OptionalMonthYearFields } from './OptionalMonthYearFields';

/**
 * Add/edit/delete editors for the remaining Career Profile sections
 * that plan.md Stage 5 groups together as "skills and other sections":
 * Education, Certifications, Awards, Publications, Volunteer
 * Experience, Professional Affiliations, and Custom Sections.
 */

export function EducationEditor({
  education,
  onChange,
}: {
  education: Education[];
  onChange: (education: Education[]) => void;
}) {
  return (
    <ListEditor<Education>
      legend="Education"
      items={education}
      onChange={onChange}
      createItem={() => ({ institution: '' })}
      itemLabel={(index) => `Education ${index + 1}`}
      addButtonLabel="Add education"
      renderFields={(item, onUpdate) => {
        const idPrefix = `education-${item.id}`;
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

export function CertificationsEditor({
  certifications,
  onChange,
}: {
  certifications: Certification[];
  onChange: (certifications: Certification[]) => void;
}) {
  return (
    <ListEditor<Certification>
      legend="Certifications"
      items={certifications}
      onChange={onChange}
      createItem={() => ({ name: '' })}
      itemLabel={(index) => `Certification ${index + 1}`}
      addButtonLabel="Add certification"
      renderFields={(item, onUpdate) => {
        const idPrefix = `certification-${item.id}`;
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
            <LabeledTextField
              id={`${idPrefix}-credential-url`}
              label="Credential URL"
              type="url"
              value={item.credentialUrl ?? ''}
              onChange={(credentialUrl) => onUpdate({ credentialUrl: credentialUrl || undefined })}
            />
          </>
        );
      }}
    />
  );
}

export function AwardsEditor({
  awards,
  onChange,
}: {
  awards: Award[];
  onChange: (awards: Award[]) => void;
}) {
  return (
    <ListEditor<Award>
      legend="Awards"
      items={awards}
      onChange={onChange}
      createItem={() => ({ title: '' })}
      itemLabel={(index) => `Award ${index + 1}`}
      addButtonLabel="Add award"
      renderFields={(item, onUpdate) => {
        const idPrefix = `award-${item.id}`;
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

export function PublicationsEditor({
  publications,
  onChange,
}: {
  publications: Publication[];
  onChange: (publications: Publication[]) => void;
}) {
  return (
    <ListEditor<Publication>
      legend="Publications"
      items={publications}
      onChange={onChange}
      createItem={() => ({ title: '' })}
      itemLabel={(index) => `Publication ${index + 1}`}
      addButtonLabel="Add publication"
      renderFields={(item, onUpdate) => {
        const idPrefix = `publication-${item.id}`;
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
            <OptionalMonthYearFields
              idPrefix={`${idPrefix}-date`}
              monthLabel="Month"
              yearLabel="Year"
              value={item.date}
              onChange={(date) => onUpdate({ date })}
            />
            <LabeledTextField
              id={`${idPrefix}-url`}
              label="URL"
              type="url"
              value={item.url ?? ''}
              onChange={(url) => onUpdate({ url: url || undefined })}
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

export function VolunteerExperienceEditor({
  volunteerExperience,
  onChange,
}: {
  volunteerExperience: VolunteerExperience[];
  onChange: (volunteerExperience: VolunteerExperience[]) => void;
}) {
  return (
    <ListEditor<VolunteerExperience>
      legend="Volunteer experience"
      items={volunteerExperience}
      onChange={onChange}
      createItem={() => ({ organization: '' })}
      itemLabel={(index) => `Volunteer experience ${index + 1}`}
      addButtonLabel="Add volunteer experience"
      renderFields={(item, onUpdate) => {
        const idPrefix = `volunteer-${item.id}`;
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

export function ProfessionalAffiliationsEditor({
  professionalAffiliations,
  onChange,
}: {
  professionalAffiliations: ProfessionalAffiliation[];
  onChange: (professionalAffiliations: ProfessionalAffiliation[]) => void;
}) {
  return (
    <ListEditor<ProfessionalAffiliation>
      legend="Professional affiliations"
      items={professionalAffiliations}
      onChange={onChange}
      createItem={() => ({ organization: '' })}
      itemLabel={(index) => `Professional affiliation ${index + 1}`}
      addButtonLabel="Add professional affiliation"
      renderFields={(item, onUpdate) => {
        const idPrefix = `affiliation-${item.id}`;
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
          </>
        );
      }}
    />
  );
}

export function CustomSectionsEditor({
  customSections,
  onChange,
}: {
  customSections: CustomSection[];
  onChange: (customSections: CustomSection[]) => void;
}) {
  return (
    <ListEditor<CustomSection>
      legend="Custom sections"
      items={customSections}
      onChange={onChange}
      createItem={() => ({ title: '', content: '' })}
      itemLabel={(index) => `Custom section ${index + 1}`}
      addButtonLabel="Add custom section"
      renderFields={(item, onUpdate) => {
        const idPrefix = `custom-section-${item.id}`;
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
