import { StyleSheet } from '@react-pdf/renderer';

/**
 * `@react-pdf/renderer` style sheet for the Cover Letter PDF (plan.md
 * Stage 14.5; specification.md section 3.4: "a separate, simple
 * single-page text layout (not the multi-section resume template)").
 *
 * Deliberately NOT derived from `ResumeTemplate`/`resume-pdf/styles.ts`
 * — a cover letter is a plain formal letter (no section headings, no
 * bullet markers, no pagination), so it gets its own small, fixed
 * style sheet rather than reusing the Resume's multi-section layout
 * system.
 */
export function buildCoverLetterPdfStyles() {
  return StyleSheet.create({
    page: {
      paddingTop: 54,
      paddingRight: 54,
      paddingBottom: 54,
      paddingLeft: 54,
      fontFamily: 'Helvetica',
      fontSize: 11,
      lineHeight: 1.4,
      color: '#1a1a1a',
    },
    senderName: {
      fontSize: 13,
      fontWeight: 700,
      marginBottom: 4,
    },
    senderContactLine: {
      fontSize: 10,
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginBottom: 18,
    },
    contactSegment: {
      flexDirection: 'row',
    },
    link: {
      color: '#1a1a1a',
      textDecoration: 'underline',
    },
    recipientLine: {
      marginBottom: 2,
    },
    recipientBlock: {
      marginBottom: 18,
    },
    salutation: {
      marginBottom: 12,
    },
    paragraph: {
      marginBottom: 12,
    },
    closing: {
      marginTop: 6,
    },
    signatureName: {
      marginTop: 24,
    },
  });
}
