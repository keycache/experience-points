import { Text, View } from '@react-pdf/renderer';
import type { ResumeEducation as ResumeEducationItem } from '../../schemas/resume';
import { formatMonthYear } from '../../utils/dates';
import type { buildResumePdfStyles } from './styles';

interface ResumePdfEducationEntryProps {
  education: ResumeEducationItem;
  styles: ReturnType<typeof buildResumePdfStyles>;
}

/** A single Education entry for the PDF. */
export function ResumePdfEducationEntry({ education, styles }: ResumePdfEducationEntryProps) {
  const hasDates = Boolean(education.startDate || education.endDate);
  const dates = hasDates
    ? `${formatMonthYear(education.startDate)} \u2013 ${formatMonthYear(education.endDate)}`
    : '';

  return (
    <View style={styles.entry}>
      <View style={styles.entryTitleRow}>
        <Text style={styles.entryTitle}>
          {education.institution}
          {education.degree ? `, ${education.degree}` : ''}
          {education.fieldOfStudy ? ` (${education.fieldOfStudy})` : ''}
        </Text>
        {hasDates && <Text style={styles.entryDates}>{dates}</Text>}
      </View>
      {education.details && <Text style={styles.entryDetails}>{education.details}</Text>}
    </View>
  );
}
