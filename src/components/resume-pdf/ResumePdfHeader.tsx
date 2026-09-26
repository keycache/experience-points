import { Link, Text, View } from '@react-pdf/renderer';
import type { ContactInfo } from '../../schemas/common';
import { buildContactSegments } from '../../services/resume-preview/contactSegments';
import type { buildResumePdfStyles } from './styles';

interface ResumePdfHeaderProps {
  contact: ContactInfo;
  styles: ReturnType<typeof buildResumePdfStyles>;
}

/**
 * Centered contact/header area for the PDF (specification.md section
 * 14). Every link is a real `<Link>` element so it is clickable in
 * the exported PDF (section 16, "Contact Information" / plan.md
 * Stage 12 "Clickable links").
 */
export function ResumePdfHeader({ contact, styles }: ResumePdfHeaderProps) {
  const segments = buildContactSegments(contact);

  return (
    <View style={styles.header}>
      <Text style={styles.name}>{contact.fullName}</Text>
      {segments.length > 0 && (
        <View style={styles.contactLine}>
          {segments.map((segment, index) => (
            <Text key={segment.key} style={styles.contactSegment}>
              {index > 0 ? ' | ' : ''}
              {segment.href ? (
                <Link src={segment.href} style={styles.link}>
                  {segment.label}
                </Link>
              ) : (
                segment.label
              )}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
}
