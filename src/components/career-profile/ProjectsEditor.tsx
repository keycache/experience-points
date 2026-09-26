import type { Accomplishment, Project } from '../../schemas/careerProfile';
import { ListEditor } from './ListEditor';
import { LabeledTagsField, LabeledTextField } from './fields';

interface AccomplishmentFieldsProps {
  idPrefix: string;
  accomplishment: Accomplishment;
  onUpdate: (patch: Partial<Accomplishment>) => void;
}

function AccomplishmentFields({ idPrefix, accomplishment, onUpdate }: AccomplishmentFieldsProps) {
  return (
    <>
      <LabeledTextField
        id={`${idPrefix}-description`}
        label="Description"
        multiline
        value={accomplishment.description}
        onChange={(description) => onUpdate({ description })}
      />
      <LabeledTextField
        id={`${idPrefix}-impact`}
        label="Impact"
        value={accomplishment.impact ?? ''}
        onChange={(impact) => onUpdate({ impact: impact || undefined })}
      />
      <LabeledTextField
        id={`${idPrefix}-scale`}
        label="Scale"
        value={accomplishment.scale ?? ''}
        onChange={(scale) => onUpdate({ scale: scale || undefined })}
      />
      <LabeledTagsField
        id={`${idPrefix}-technologies`}
        label="Technologies"
        value={accomplishment.technologies}
        onChange={(technologies) => onUpdate({ technologies })}
      />
    </>
  );
}

interface ProjectsEditorProps {
  legend: string;
  idPrefix: string;
  projects: Project[];
  onChange: (projects: Project[]) => void;
}

/**
 * Add/edit/delete editor for a `Project[]` array, including each
 * project's nested `Accomplishment[]` list. Reused for both
 * `Experience.projects` and the top-level `CareerProfile.projects`
 * (standalone/personal projects), since both use `ProjectSchema`.
 */
export function ProjectsEditor({ legend, idPrefix, projects, onChange }: ProjectsEditorProps) {
  return (
    <ListEditor<Project>
      legend={legend}
      items={projects}
      onChange={onChange}
      createItem={() => ({ name: '', description: undefined, accomplishments: [], technologies: [] })}
      itemLabel={(index) => `Project ${index + 1}`}
      addButtonLabel="Add project"
      renderFields={(project, onUpdate) => {
        const fieldIdPrefix = `${idPrefix}-project-${project.id}`;
        return (
          <>
            <LabeledTextField
              id={`${fieldIdPrefix}-name`}
              label="Project name"
              value={project.name}
              onChange={(name) => onUpdate({ name })}
            />
            <LabeledTextField
              id={`${fieldIdPrefix}-description`}
              label="Description"
              multiline
              value={project.description ?? ''}
              onChange={(description) => onUpdate({ description: description || undefined })}
            />
            <LabeledTagsField
              id={`${fieldIdPrefix}-technologies`}
              label="Technologies"
              value={project.technologies}
              onChange={(technologies) => onUpdate({ technologies })}
            />
            <ListEditor<Accomplishment>
              legend="Accomplishments"
              items={project.accomplishments}
              onChange={(accomplishments) => onUpdate({ accomplishments })}
              createItem={() => ({ description: '', technologies: [] })}
              itemLabel={(index) => `Accomplishment ${index + 1}`}
              addButtonLabel="Add accomplishment"
              renderFields={(accomplishment, onUpdateAccomplishment) => (
                <AccomplishmentFields
                  idPrefix={`${fieldIdPrefix}-accomplishment-${accomplishment.id}`}
                  accomplishment={accomplishment}
                  onUpdate={onUpdateAccomplishment}
                />
              )}
            />
          </>
        );
      }}
    />
  );
}
