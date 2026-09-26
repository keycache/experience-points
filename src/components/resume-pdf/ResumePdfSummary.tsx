import { Text, View } from '@react-pdf/renderer';
import type { buildResumePdfStyles } from './styles';

interface ResumePdfSectionHeadingProps {
  title: string;
  styles: ReturnType<typeof buildResumePdfStyles>;
}

/** A strong section heading, shared by every resume section (specification.md section 14). */
export function ResumePdfSectionHeading({ title, styles }: ResumePdfSectionHeadingProps) {
  return (
    <View style={styles.sectionHeading} wrap={false}>
      <Text>{title}</Text>
    </View>
  );
}

interface ResumePdfSummaryProps {
  text: string;
  styles: ReturnType<typeof buildResumePdfStyles>;
}

/** Profile Summary section body. */
export function ResumePdfSummary({ text, styles }: ResumePdfSummaryProps) {
  return <Text style={styles.summary}>{text}</Text>;
}
