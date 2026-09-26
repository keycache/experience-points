import type { JobDescription } from '../../schemas/jobDescription';
import { LabeledTextField } from '../career-profile/fields';
import { StringListEditor } from '../common/StringListEditor';

interface JobDescriptionEditorProps {
  jobDescription: JobDescription;
  onChange: (jobDescription: JobDescription) => void;
}

/**
 * Structured Job Description editor (plan.md Stage 6). A purely
 * controlled component, mirroring the Career Profile editor pattern
 * from Stage 5: no local state, calls `onChange` with the complete
 * next `JobDescription` on every edit.
 */
export function JobDescriptionEditor({ jobDescription, onChange }: JobDescriptionEditorProps) {
  function updateField<K extends keyof JobDescription>(key: K, value: JobDescription[K]) {
    onChange({ ...jobDescription, [key]: value });
  }

  function updateMetadata<K extends keyof JobDescription['metadata']>(
    key: K,
    value: JobDescription['metadata'][K],
  ) {
    onChange({ ...jobDescription, metadata: { ...jobDescription.metadata, [key]: value } });
  }

  return (
    <div className="job-description-editor">
      <fieldset className="list-editor">
        <legend>Metadata</legend>
        <LabeledTextField
          id="jd-title"
          label="Title"
          value={jobDescription.metadata.title}
          onChange={(title) => updateMetadata('title', title)}
        />
        <LabeledTextField
          id="jd-company"
          label="Company"
          value={jobDescription.metadata.company ?? ''}
          onChange={(company) => updateMetadata('company', company || undefined)}
        />
        <LabeledTextField
          id="jd-location"
          label="Location"
          value={jobDescription.metadata.location ?? ''}
          onChange={(location) => updateMetadata('location', location || undefined)}
        />
      </fieldset>

      <LabeledTextField
        id="jd-summary"
        label="Summary"
        multiline
        value={jobDescription.summary ?? ''}
        onChange={(summary) => updateField('summary', summary || undefined)}
      />

      <StringListEditor
        legend="Responsibilities"
        items={jobDescription.responsibilities}
        onChange={(responsibilities) => updateField('responsibilities', responsibilities)}
        addButtonLabel="Add responsibility"
        itemLabel={(index) => `Responsibility ${index + 1}`}
      />

      <StringListEditor
        legend="Requirements"
        items={jobDescription.requirements}
        onChange={(requirements) => updateField('requirements', requirements)}
        addButtonLabel="Add requirement"
        itemLabel={(index) => `Requirement ${index + 1}`}
      />

      <StringListEditor
        legend="Preferred qualifications"
        items={jobDescription.preferredQualifications}
        onChange={(preferredQualifications) =>
          updateField('preferredQualifications', preferredQualifications)
        }
        addButtonLabel="Add preferred qualification"
        itemLabel={(index) => `Preferred qualification ${index + 1}`}
      />

      <StringListEditor
        legend="Technologies"
        items={jobDescription.technologies}
        onChange={(technologies) => updateField('technologies', technologies)}
        addButtonLabel="Add technology"
        itemLabel={(index) => `Technology ${index + 1}`}
      />

      <StringListEditor
        legend="Leadership expectations"
        items={jobDescription.leadershipExpectations}
        onChange={(leadershipExpectations) =>
          updateField('leadershipExpectations', leadershipExpectations)
        }
        addButtonLabel="Add leadership expectation"
        itemLabel={(index) => `Leadership expectation ${index + 1}`}
      />

      <StringListEditor
        legend="Domain signals"
        items={jobDescription.domainSignals}
        onChange={(domainSignals) => updateField('domainSignals', domainSignals)}
        addButtonLabel="Add domain signal"
        itemLabel={(index) => `Domain signal ${index + 1}`}
      />

      <StringListEditor
        legend="Other signals"
        items={jobDescription.otherSignals}
        onChange={(otherSignals) => updateField('otherSignals', otherSignals)}
        addButtonLabel="Add other signal"
        itemLabel={(index) => `Other signal ${index + 1}`}
      />
    </div>
  );
}
