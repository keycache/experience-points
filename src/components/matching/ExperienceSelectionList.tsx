import type { CareerProfile, Experience } from '../../schemas/careerProfile';
import { describeExperience } from './experienceLabels';

interface ExperienceSelectionListProps {
  careerProfile: CareerProfile;
  recommendedIds: string[];
  selectedIds: string[];
  editable: boolean;
  onToggle: (experienceId: string) => void;
}

/**
 * Renders every Career Profile experience with a checkbox reflecting
 * whether it is currently selected for resume tailoring, and a badge
 * when the AI recommended it (specification.md section 10: "The UI
 * may show AI recommendations, but the user has final control").
 *
 * In "Best Match" mode the checkboxes are disabled (the AI's selection
 * is authoritative); in "I'll Select" mode they are editable and
 * pre-checked from the AI recommendation as a starting point.
 */
export function ExperienceSelectionList({
  careerProfile,
  recommendedIds,
  selectedIds,
  editable,
  onToggle,
}: ExperienceSelectionListProps) {
  const recommendedSet = new Set(recommendedIds);
  const selectedSet = new Set(selectedIds);

  if (careerProfile.experience.length === 0) {
    return <p>The Career Profile has no experience entries to select from.</p>;
  }

  return (
    <fieldset className="list-editor">
      <legend>Experience selection</legend>
      {careerProfile.experience.map((experience: Experience) => {
        const inputId = `match-selection-${experience.id}`;
        const isRecommended = recommendedSet.has(experience.id);
        const isSelected = selectedSet.has(experience.id);
        return (
          <div key={experience.id} className="experience-selection-list__row">
            <input
              id={inputId}
              type="checkbox"
              checked={isSelected}
              disabled={!editable}
              onChange={() => onToggle(experience.id)}
            />
            <label htmlFor={inputId}>{describeExperience(experience)}</label>
            {isRecommended && (
              <span className="experience-selection-list__badge">AI recommended</span>
            )}
          </div>
        );
      })}
    </fieldset>
  );
}
