import type { ResumeExperience } from '../../schemas/resume';
import { formatMonthYear } from '../../utils/dates';

interface ResumeExperienceRoleHeaderProps {
  experience: ResumeExperience;
}

/**
 * A single role's heading: company, role, location, and dates. Long
 * company/role names are allowed to wrap onto additional lines
 * (`resume-doc__role-heading` uses `overflow-wrap: break-word`, never
 * `text-overflow: ellipsis`), per plan.md Stage 11's "long company
 * names wrap" requirement.
 */
export function ResumeExperienceRoleHeader({ experience }: ResumeExperienceRoleHeaderProps) {
  const dates = `${formatMonthYear(experience.startDate)} \u2013 ${
    experience.isCurrent ? 'Present' : formatMonthYear(experience.endDate)
  }`;

  return (
    <div className="resume-doc__role-heading">
      <span className="resume-doc__role-company">{experience.company}</span>
      {' \u2014 '}
      <span className="resume-doc__role-title">{experience.role}</span>
      {experience.location && <span className="resume-doc__role-location">, {experience.location}</span>}
      <span className="resume-doc__role-dates">{dates}</span>
    </div>
  );
}

interface ResumeExperienceRoleStartProps {
  experience: ResumeExperience;
}

/**
 * Renders a role's heading together with its first bullet as a single
 * visual unit — mirrors the `experience-role-start` layout block,
 * which pagination (plan.md Stage 11 / specification.md section 15)
 * never splits across a page boundary.
 */
export function ResumeExperienceRoleStart({ experience }: ResumeExperienceRoleStartProps) {
  const firstBullet = experience.bullets[0];

  return (
    <div className="resume-doc__role" role="group" aria-label={`${experience.company} role`}>
      <ResumeExperienceRoleHeader experience={experience} />
      {firstBullet && (
        <ul className="resume-doc__bullets" aria-label={`${experience.company} bullets`}>
          <li className="resume-doc__bullet">{firstBullet.text}</li>
        </ul>
      )}
    </div>
  );
}

interface ResumeExperienceRoleRestProps {
  experience: ResumeExperience;
  fromBulletIndex: number;
}

/**
 * Renders a role's remaining bullets (after the first), as a
 * continuation of the same visual list. Corresponds to the
 * `experience-role-rest` layout block, which may land on a later page
 * than the role's heading/first bullet when the role is long.
 */
export function ResumeExperienceRoleRest({ experience, fromBulletIndex }: ResumeExperienceRoleRestProps) {
  const rest = experience.bullets.slice(fromBulletIndex);
  if (rest.length === 0) {
    return null;
  }

  return (
    <ul
      className="resume-doc__bullets resume-doc__bullets--continuation"
      aria-label={`${experience.company} bullets (continued)`}
    >
      {rest.map((bullet) => (
        <li key={bullet.id} className="resume-doc__bullet">
          {bullet.text}
        </li>
      ))}
    </ul>
  );
}
