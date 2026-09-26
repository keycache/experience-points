import type { ContactInfo } from '../../schemas/common';
import { buildContactSegments } from '../../services/resume-preview/contactSegments';

interface ResumeHeaderProps {
  contact: ContactInfo;
}

/**
 * Centered contact/header area (specification.md section 14). All
 * profile links remain clickable (section 16, "Contact Information").
 */
export function ResumeHeader({ contact }: ResumeHeaderProps) {
  const segments = buildContactSegments(contact);

  return (
    <header className="resume-doc__header">
      <h1 className="resume-doc__name">{contact.fullName}</h1>
      {segments.length > 0 && (
        <p className="resume-doc__contact-line">
          {segments.map((segment, index) => (
            <span key={segment.key}>
              {index > 0 && <span aria-hidden="true"> | </span>}
              {segment.href ? (
                <a href={segment.href} className="resume-doc__link">
                  {segment.label}
                </a>
              ) : (
                segment.label
              )}
            </span>
          ))}
        </p>
      )}
    </header>
  );
}
