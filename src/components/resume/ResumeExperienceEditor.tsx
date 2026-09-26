import type { ResumeBullet, ResumeExperience } from '../../schemas/resume';
import { MAX_BULLETS_PER_ROLE } from '../../schemas/resume';
import { ListEditor } from '../career-profile/ListEditor';
import {
  LabeledCheckboxField,
  LabeledNumberField,
  LabeledTextField,
} from '../career-profile/fields';

interface ResumeExperienceEditorProps {
  experience: ResumeExperience[];
  onChange: (experience: ResumeExperience[]) => void;
}

/**
 * Add/edit/delete/reorder editor for `Resume.experience`, including
 * each role's nested Bullets list (plan.md Stage 10).
 *
 * Bullets are capped at `MAX_BULLETS_PER_ROLE` in the UI (the "Add
 * bullet" button disables once the limit is reached) to keep edits
 * naturally compliant with `ResumeSchema`'s hard bullet-count limit.
 */
export function ResumeExperienceEditor({ experience, onChange }: ResumeExperienceEditorProps) {
  return (
    <ListEditor<ResumeExperience>
      legend="Experience"
      items={experience}
      onChange={onChange}
      createItem={() => ({
        company: '',
        role: '',
        startDate: { month: 1, year: new Date().getFullYear() },
        isCurrent: false,
        bullets: [],
      })}
      itemLabel={(index) => `Experience ${index + 1}`}
      addButtonLabel="Add experience"
      renderFields={(item, onUpdate) => {
        const idPrefix = `resume-experience-${item.id}`;
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
            <ListEditor<ResumeBullet>
              legend="Bullets"
              items={item.bullets}
              onChange={(bullets) => onUpdate({ bullets })}
              createItem={() => ({ text: '' })}
              itemLabel={(index) => `Bullet ${index + 1}`}
              addButtonLabel="Add bullet"
              maxItems={MAX_BULLETS_PER_ROLE}
              addDisabledMessage={`Maximum of ${MAX_BULLETS_PER_ROLE} bullets reached.`}
              renderFields={(bullet, onUpdateBullet) => (
                <LabeledTextField
                  id={`${idPrefix}-bullet-${bullet.id}`}
                  label="Bullet text"
                  multiline
                  value={bullet.text}
                  onChange={(text) => onUpdateBullet({ text })}
                />
              )}
            />
            <p className="resume-view__bullet-count">{item.bullets.length} bullet(s)</p>
          </>
        );
      }}
    />
  );
}
