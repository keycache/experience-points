import type { ResumeEducation as ResumeEducationItem } from '../../schemas/resume';
import { formatMonthYear } from '../../utils/dates';

interface ResumeEducationEntryProps {
  education: ResumeEducationItem;
}

/** A single Education entry. */
export function ResumeEducationEntry({ education }: ResumeEducationEntryProps) {
  const hasDates = education.startDate || education.endDate;

  return (
    <div className="resume-doc__entry">
      <span className="resume-doc__entry-title">{education.institution}</span>
      {education.degree && <span className="resume-doc__entry-subtitle">, {education.degree}</span>}
      {education.fieldOfStudy && <span className="resume-doc__entry-subtitle"> ({education.fieldOfStudy})</span>}
      {hasDates && (
        <span className="resume-doc__entry-dates">
          {formatMonthYear(education.startDate)}
          {education.startDate || education.endDate ? ' \u2013 ' : ''}
          {formatMonthYear(education.endDate)}
        </span>
      )}
      {education.details && <p className="resume-doc__entry-details">{education.details}</p>}
    </div>
  );
}
