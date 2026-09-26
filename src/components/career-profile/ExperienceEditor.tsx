import type { Experience } from '../../schemas/careerProfile';
import { ListEditor } from './ListEditor';
import { ProjectsEditor } from './ProjectsEditor';
import {
  LabeledCheckboxField,
  LabeledNumberField,
  LabeledTagsField,
  LabeledTextField,
} from './fields';

interface ExperienceEditorProps {
  experience: Experience[];
  onChange: (experience: Experience[]) => void;
}

/**
 * Add/edit/delete editor for `CareerProfile.experience`, including each
 * role's nested Projects/Accomplishments. See plan.md Stage 5.
 */
export function ExperienceEditor({ experience, onChange }: ExperienceEditorProps) {
  return (
    <ListEditor<Experience>
      legend="Experience"
      items={experience}
      onChange={onChange}
      createItem={() => ({
        company: '',
        role: '',
        startDate: { month: 1, year: new Date().getFullYear() },
        isCurrent: false,
        projects: [],
        technologies: [],
      })}
      itemLabel={(index) => `Experience ${index + 1}`}
      addButtonLabel="Add experience"
      renderFields={(item, onUpdate) => {
        const idPrefix = `experience-${item.id}`;
        return (
          <>
            <LabeledTextField
              id={`${idPrefix}-company`}
              label="Company"
              value={item.company}
              onChange={(company) => onUpdate({ company })}
            />
            <LabeledTextField
              id={`${idPrefix}-role`}
              label="Role"
              value={item.role}
              onChange={(role) => onUpdate({ role })}
            />
            <LabeledTextField
              id={`${idPrefix}-location`}
              label="Location"
              value={item.location ?? ''}
              onChange={(location) => onUpdate({ location: location || undefined })}
            />
            <LabeledNumberField
              id={`${idPrefix}-start-month`}
              label="Start month"
              min={1}
              max={12}
              value={item.startDate.month}
              onChange={(month) =>
                onUpdate({ startDate: { ...item.startDate, month: month ?? item.startDate.month } })
              }
            />
            <LabeledNumberField
              id={`${idPrefix}-start-year`}
              label="Start year"
              value={item.startDate.year}
              onChange={(year) =>
                onUpdate({ startDate: { ...item.startDate, year: year ?? item.startDate.year } })
              }
            />
            <LabeledCheckboxField
              id={`${idPrefix}-is-current`}
              label="Current role"
              checked={item.isCurrent}
              onChange={(isCurrent) =>
                onUpdate({ isCurrent, endDate: isCurrent ? undefined : item.endDate })
              }
            />
            {!item.isCurrent && (
              <>
                <LabeledNumberField
                  id={`${idPrefix}-end-month`}
                  label="End month"
                  min={1}
                  max={12}
                  value={item.endDate?.month}
                  onChange={(month) =>
                    onUpdate({
                      endDate: { month: month ?? 1, year: item.endDate?.year ?? item.startDate.year },
                    })
                  }
                />
                <LabeledNumberField
                  id={`${idPrefix}-end-year`}
                  label="End year"
                  value={item.endDate?.year}
                  onChange={(year) =>
                    onUpdate({
                      endDate: { month: item.endDate?.month ?? 1, year: year ?? item.startDate.year },
                    })
                  }
                />
              </>
            )}
            <LabeledTagsField
              id={`${idPrefix}-technologies`}
              label="Technologies"
              value={item.technologies}
              onChange={(technologies) => onUpdate({ technologies })}
            />
            <ProjectsEditor
              legend="Projects"
              idPrefix={idPrefix}
              projects={item.projects}
              onChange={(projects) => onUpdate({ projects })}
            />
          </>
        );
      }}
    />
  );
}
