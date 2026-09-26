import { Text, View } from '@react-pdf/renderer';
import type { ResumeExperience } from '../../schemas/resume';
import { formatMonthYear } from '../../utils/dates';
import type { buildResumePdfStyles } from './styles';

type Styles = ReturnType<typeof buildResumePdfStyles>;

function RoleHeading({ experience, styles }: { experience: ResumeExperience; styles: Styles }) {
  const dates = `${formatMonthYear(experience.startDate)} \u2013 ${
    experience.isCurrent ? 'Present' : formatMonthYear(experience.endDate)
  }`;
  const locationSuffix = experience.location ? `, ${experience.location}` : '';

  return (
    <View style={styles.roleHeadingRow}>
      <Text style={styles.roleHeadingText}>
        {experience.company}
        {' \u2014 '}
        {experience.role}
        {locationSuffix}
      </Text>
      <Text style={styles.roleDates}>{dates}</Text>
    </View>
  );
}

interface ResumePdfExperienceRoleStartProps {
  experience: ResumeExperience;
  styles: Styles;
}

/**
 * Renders a role's heading together with its first bullet as a single
 * non-splitting unit (`wrap={false}`), matching the `experience-role-start`
 * layout block that pagination never separates across a page
 * (plan.md Stage 11/12; specification.md section 15).
 */
export function ResumePdfExperienceRoleStart({ experience, styles }: ResumePdfExperienceRoleStartProps) {
  const firstBullet = experience.bullets[0];

  return (
    <View style={styles.role} wrap={false}>
      <RoleHeading experience={experience} styles={styles} />
      {firstBullet && (
        <View style={styles.bulletList}>
          <View style={styles.bulletRow}>
            <Text style={styles.bulletMarker}>{'\u2022'}</Text>
            <Text style={styles.bulletText}>{firstBullet.text}</Text>
          </View>
        </View>
      )}
    </View>
  );
}

interface ResumePdfExperienceRoleRestProps {
  experience: ResumeExperience;
  fromBulletIndex: number;
  styles: Styles;
}

/** Renders a role's remaining bullets, corresponding to the `experience-role-rest` layout block. */
export function ResumePdfExperienceRoleRest({
  experience,
  fromBulletIndex,
  styles,
}: ResumePdfExperienceRoleRestProps) {
  const rest = experience.bullets.slice(fromBulletIndex);
  if (rest.length === 0) {
    return null;
  }

  return (
    <View style={styles.bulletList} wrap={false}>
      {rest.map((bullet) => (
        <View key={bullet.id} style={styles.bulletRow}>
          <Text style={styles.bulletMarker}>{'\u2022'}</Text>
          <Text style={styles.bulletText}>{bullet.text}</Text>
        </View>
      ))}
    </View>
  );
}
