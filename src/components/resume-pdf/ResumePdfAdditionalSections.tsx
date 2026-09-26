import { Link, Text, View } from '@react-pdf/renderer';
import type {
  ResumeAward,
  ResumeCertification,
  ResumeProfessionalAffiliation,
  ResumeProject,
  ResumePublication,
  ResumeVolunteerExperience,
} from '../../schemas/resume';
import { formatMonthYear } from '../../utils/dates';
import type { buildResumePdfStyles } from './styles';

type Styles = ReturnType<typeof buildResumePdfStyles>;

/**
 * Entry renderers for every "additional resume section" beyond
 * Experience/Education, mirroring `resume-document/ResumeAdditionalSections.tsx`
 * (specification.md section 14).
 */

export function ResumePdfCertificationEntry({
  certification,
  styles,
}: {
  certification: ResumeCertification;
  styles: Styles;
}) {
  return (
    <View style={styles.entry}>
      <View style={styles.entryTitleRow}>
        <Text style={styles.entryTitle}>
          {certification.name}
          {certification.issuer ? `, ${certification.issuer}` : ''}
        </Text>
        {certification.dateAwarded && (
          <Text style={styles.entryDates}>{formatMonthYear(certification.dateAwarded)}</Text>
        )}
      </View>
    </View>
  );
}

export function ResumePdfProjectEntry({ project, styles }: { project: ResumeProject; styles: Styles }) {
  return (
    <View style={styles.entry}>
      <Text style={styles.entryTitle}>{project.name}</Text>
      {project.description && <Text style={styles.entryDetails}>{project.description}</Text>}
      {project.technologies.length > 0 && (
        <Text style={styles.entryDetails}>{project.technologies.join(', ')}</Text>
      )}
    </View>
  );
}

export function ResumePdfAwardEntry({ award, styles }: { award: ResumeAward; styles: Styles }) {
  return (
    <View style={styles.entry}>
      <View style={styles.entryTitleRow}>
        <Text style={styles.entryTitle}>
          {award.title}
          {award.issuer ? `, ${award.issuer}` : ''}
        </Text>
        {award.date && <Text style={styles.entryDates}>{formatMonthYear(award.date)}</Text>}
      </View>
    </View>
  );
}

export function ResumePdfPublicationEntry({
  publication,
  styles,
}: {
  publication: ResumePublication;
  styles: Styles;
}) {
  return (
    <View style={styles.entry}>
      {publication.url ? (
        <Link src={publication.url} style={[styles.entryTitle, styles.link]}>
          {publication.title}
        </Link>
      ) : (
        <Text style={styles.entryTitle}>{publication.title}</Text>
      )}
      {publication.publisher && <Text style={styles.entrySubtitle}>{publication.publisher}</Text>}
    </View>
  );
}

export function ResumePdfVolunteerEntry({
  entry,
  styles,
}: {
  entry: ResumeVolunteerExperience;
  styles: Styles;
}) {
  return (
    <View style={styles.entry}>
      <Text style={styles.entryTitle}>
        {entry.organization}
        {entry.role ? `, ${entry.role}` : ''}
      </Text>
      {entry.description && <Text style={styles.entryDetails}>{entry.description}</Text>}
    </View>
  );
}

export function ResumePdfAffiliationEntry({
  entry,
  styles,
}: {
  entry: ResumeProfessionalAffiliation;
  styles: Styles;
}) {
  return (
    <View style={styles.entry}>
      <Text style={styles.entryTitle}>
        {entry.organization}
        {entry.role ? `, ${entry.role}` : ''}
      </Text>
    </View>
  );
}
