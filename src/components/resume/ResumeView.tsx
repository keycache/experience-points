import type { Resume } from '../../schemas/resume';

const MONTH_LABELS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

function formatMonthYear(monthYear: { month: number; year: number } | undefined): string {
  if (!monthYear) {
    return '';
  }
  return `${MONTH_LABELS[monthYear.month - 1] ?? monthYear.month} ${monthYear.year}`;
}

interface ResumeViewProps {
  resume: Resume;
}

/**
 * Read-only display of a generated Resume (plan.md Stage 9's manual
 * test: confirming the summary, skills, bullet ordering, and bullet
 * count are visible). Full add/edit/delete controls arrive in Stage
 * 10 (Resume Editor); this view is intentionally read-only.
 */
export function ResumeView({ resume }: ResumeViewProps) {
  return (
    <div className="resume-view">
      <section className="list-editor">
        <h3>Contact</h3>
        <p>{resume.contact.fullName}</p>
      </section>

      {resume.profileSummary && (
        <section className="list-editor">
          <h3>Profile summary</h3>
          <p>{resume.profileSummary}</p>
        </section>
      )}

      {resume.skills.length > 0 && (
        <section className="list-editor">
          <h3>Skills</h3>
          <ul>
            {resume.skills.map((skill) => (
              <li key={skill}>{skill}</li>
            ))}
          </ul>
        </section>
      )}

      {resume.experience.length > 0 && (
        <section className="list-editor">
          <h3>Experience</h3>
          {resume.experience.map((experience) => (
            <div key={experience.id} className="resume-view__experience">
              <h4>
                {experience.company} &mdash; {experience.role}
              </h4>
              <p className="resume-view__dates">
                {formatMonthYear(experience.startDate)}
                {' – '}
                {experience.isCurrent ? 'Present' : formatMonthYear(experience.endDate)}
              </p>
              <ul aria-label={`${experience.company} bullets`}>
                {experience.bullets.map((bullet) => (
                  <li key={bullet.id}>{bullet.text}</li>
                ))}
              </ul>
              <p className="resume-view__bullet-count">{experience.bullets.length} bullet(s)</p>
            </div>
          ))}
        </section>
      )}

      {resume.education.length > 0 && (
        <section className="list-editor">
          <h3>Education</h3>
          <ul>
            {resume.education.map((education) => (
              <li key={education.id}>
                {education.institution}
                {education.degree ? ` — ${education.degree}` : ''}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
