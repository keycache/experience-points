import { Document, Link, Page, Text, View } from '@react-pdf/renderer';
import type { CoverLetter } from '../../schemas/coverLetter';
import { PAGE_HEIGHT_PT, PAGE_WIDTH_PT } from '../resume-document/template';
import { buildContactSegments } from '../../services/resume-preview/contactSegments';
import { buildCoverLetterPdfStyles } from './styles';

interface CoverLetterPdfDocumentProps {
  coverLetter: CoverLetter;
}

/**
 * The Cover Letter PDF document (plan.md Stage 14.5; specification.md
 * section 3.4). A single, simple page: sender contact header,
 * optional recipient block, salutation, body paragraphs, closing, and
 * a signature line — no section headings, bullets, or pagination
 * (that machinery belongs to the Resume PDF, not this one).
 *
 * Reuses `PAGE_WIDTH_PT`/`PAGE_HEIGHT_PT` (US Letter) from the Resume
 * PDF's template so both exported documents share the same paper
 * size, and `buildContactSegments` so sender links (mailto/tel/etc.)
 * render identically to the Resume's header.
 */
export function CoverLetterPdfDocument({ coverLetter }: CoverLetterPdfDocumentProps) {
  const styles = buildCoverLetterPdfStyles();
  const senderSegments = buildContactSegments(coverLetter.senderContact);

  return (
    <Document title={`${coverLetter.senderContact.fullName} - Cover Letter`}>
      <Page size={[PAGE_WIDTH_PT, PAGE_HEIGHT_PT]} style={styles.page}>
        <Text style={styles.senderName}>{coverLetter.senderContact.fullName}</Text>
        {senderSegments.length > 0 && (
          <View style={styles.senderContactLine}>
            {senderSegments.map((segment, index) => (
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

        {coverLetter.recipient &&
          (coverLetter.recipient.hiringManagerName || coverLetter.recipient.company) && (
            <View style={styles.recipientBlock}>
              {coverLetter.recipient.hiringManagerName && (
                <Text style={styles.recipientLine}>{coverLetter.recipient.hiringManagerName}</Text>
              )}
              {coverLetter.recipient.company && (
                <Text style={styles.recipientLine}>{coverLetter.recipient.company}</Text>
              )}
            </View>
          )}

        <Text style={styles.salutation}>{coverLetter.salutation}</Text>

        {coverLetter.bodyParagraphs.map((paragraph, index) => (
          <Text key={index} style={styles.paragraph}>
            {paragraph}
          </Text>
        ))}

        <Text style={styles.closing}>{coverLetter.closing}</Text>
        <Text style={styles.signatureName}>{coverLetter.senderContact.fullName}</Text>
      </Page>
    </Document>
  );
}
