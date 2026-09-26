import { StyleSheet } from '@react-pdf/renderer';
import type { ResumeTemplate } from '../../schemas/resumeTemplate';

/**
 * `@react-pdf/renderer` style sheet derived from the shared Resume
 * template (plan.md Stage 12; specification.md section 3.4). Sizes
 * are in PDF points, the same unit `template.ts`/`layoutBlocks.ts`
 * already use, so the numbers here are not re-derived or guessed —
 * they come directly from the same `ResumeTemplate` that drives the
 * live preview (Stage 11), keeping the two visually consistent.
 */
export function buildResumePdfStyles(template: ResumeTemplate) {
  return StyleSheet.create({
    page: {
      paddingTop: template.marginsPt.top,
      paddingRight: template.marginsPt.right,
      paddingBottom: template.marginsPt.bottom,
      paddingLeft: template.marginsPt.left,
      fontFamily: template.fontFamily,
      fontSize: template.baseFontSizePt,
      lineHeight: template.lineHeight,
      color: '#1a1a1a',
    },
    header: {
      textAlign: 'center',
      marginBottom: template.sectionSpacingPt,
    },
    name: {
      fontSize: template.headingFontSizePt * 1.4,
      fontWeight: 700,
      marginBottom: 4,
    },
    contactLine: {
      fontSize: template.baseFontSizePt * 0.85,
      flexDirection: 'row',
      justifyContent: 'center',
      flexWrap: 'wrap',
    },
    contactSegment: {
      flexDirection: 'row',
    },
    link: {
      color: '#1a1a1a',
      textDecoration: 'underline',
    },
    sectionHeading: {
      fontSize: template.headingFontSizePt,
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      borderBottomWidth: 1,
      borderBottomColor: '#333333',
      marginTop: template.sectionSpacingPt,
      marginBottom: template.sectionSpacingPt * 0.4,
      paddingBottom: 2,
    },
    summary: {
      marginBottom: template.sectionSpacingPt * 0.5,
    },
    skillsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginBottom: template.sectionSpacingPt * 0.5,
    },
    skill: {
      marginRight: 14,
      marginBottom: 2,
    },
    role: {
      marginBottom: template.sectionSpacingPt * 0.5,
    },
    roleHeadingRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      fontWeight: 700,
    },
    roleHeadingText: {
      flex: 1,
    },
    roleDates: {
      fontStyle: 'italic',
      fontWeight: 400,
    },
    bulletList: {
      marginTop: 3,
      marginBottom: 4,
    },
    bulletRow: {
      flexDirection: 'row',
      marginBottom: 2,
    },
    bulletMarker: {
      width: 10,
    },
    bulletText: {
      flex: 1,
    },
    entry: {
      marginBottom: template.sectionSpacingPt * 0.5,
    },
    entryTitleRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    entryTitle: {
      fontWeight: 700,
    },
    entrySubtitle: {
      fontStyle: 'italic',
    },
    entryDates: {
      fontStyle: 'italic',
    },
    entryDetails: {
      marginTop: 2,
    },
  });
}
