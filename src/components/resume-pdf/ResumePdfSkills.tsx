import { Text, View } from '@react-pdf/renderer';
import type { buildResumePdfStyles } from './styles';

interface ResumePdfSkillsProps {
  skills: string[];
  styles: ReturnType<typeof buildResumePdfStyles>;
}

/**
 * Skills/technical information section, rendered as a wrapped inline
 * "table-like" row (specification.md section 14) rather than one long
 * comma-separated sentence.
 */
export function ResumePdfSkills({ skills, styles }: ResumePdfSkillsProps) {
  return (
    <View style={styles.skillsRow}>
      {skills.map((skill) => (
        <Text key={skill} style={styles.skill}>
          {skill}
        </Text>
      ))}
    </View>
  );
}
