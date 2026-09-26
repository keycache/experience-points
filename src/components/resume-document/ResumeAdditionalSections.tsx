import type {
  ResumeAward,
  ResumeCertification,
  ResumeProfessionalAffiliation,
  ResumeProject,
  ResumePublication,
  ResumeVolunteerExperience,
} from '../../schemas/resume';
import { formatMonthYear } from '../../utils/dates';

/**
 * Entry renderers for every "additional resume section" beyond
 * Experience/Education (specification.md section 14): Certifications,
 * Projects, Awards, Publications, Volunteer Experience, and
 * Professional Affiliations. Each is intentionally a compact,
 * single-block entry (Stage 11 does not paginate within an entry).
 */

export function ResumeCertificationEntry({ certification }: { certification: ResumeCertification }) {
  return (
    <div className="resume-doc__entry">
      <span className="resume-doc__entry-title">{certification.name}</span>
      {certification.issuer && <span className="resume-doc__entry-subtitle">, {certification.issuer}</span>}
      {certification.dateAwarded && (
        <span className="resume-doc__entry-dates">{formatMonthYear(certification.dateAwarded)}</span>
      )}
    </div>
  );
}

export function ResumeProjectEntry({ project }: { project: ResumeProject }) {
  return (
    <div className="resume-doc__entry">
      <span className="resume-doc__entry-title">{project.name}</span>
      {project.description && <p className="resume-doc__entry-details">{project.description}</p>}
      {project.technologies.length > 0 && (
        <p className="resume-doc__entry-technologies">{project.technologies.join(', ')}</p>
      )}
    </div>
  );
}

export function ResumeAwardEntry({ award }: { award: ResumeAward }) {
  return (
    <div className="resume-doc__entry">
      <span className="resume-doc__entry-title">{award.title}</span>
      {award.issuer && <span className="resume-doc__entry-subtitle">, {award.issuer}</span>}
      {award.date && <span className="resume-doc__entry-dates">{formatMonthYear(award.date)}</span>}
    </div>
  );
}

export function ResumePublicationEntry({ publication }: { publication: ResumePublication }) {
  return (
    <div className="resume-doc__entry">
      {publication.url ? (
        <a href={publication.url} className="resume-doc__entry-title resume-doc__link">
          {publication.title}
        </a>
      ) : (
        <span className="resume-doc__entry-title">{publication.title}</span>
      )}
      {publication.publisher && <span className="resume-doc__entry-subtitle">, {publication.publisher}</span>}
    </div>
  );
}

export function ResumeVolunteerEntry({ entry }: { entry: ResumeVolunteerExperience }) {
  return (
    <div className="resume-doc__entry">
      <span className="resume-doc__entry-title">{entry.organization}</span>
      {entry.role && <span className="resume-doc__entry-subtitle">, {entry.role}</span>}
      {entry.description && <p className="resume-doc__entry-details">{entry.description}</p>}
    </div>
  );
}

export function ResumeAffiliationEntry({ entry }: { entry: ResumeProfessionalAffiliation }) {
  return (
    <div className="resume-doc__entry">
      <span className="resume-doc__entry-title">{entry.organization}</span>
      {entry.role && <span className="resume-doc__entry-subtitle">, {entry.role}</span>}
    </div>
  );
}
