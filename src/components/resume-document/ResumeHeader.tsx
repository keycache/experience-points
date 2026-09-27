import type { ContactInfo } from '../../schemas/common';
import { buildContactSegments } from '../../services/resume-preview/contactSegments';

interface ResumeHeaderProps {
  contact: ContactInfo;
}

/**
 * Centered contact/header area (specification.md section 14). All
 * profile links remain clickable (section 16, "Contact Information").
 *
 * This document is always embedded under the Preview / Export step's
 * own h2 (plan.md Stage 16, "Semantic headings") -- an h3 here keeps
 * the page's heading hierarchy correct instead of introducing a
 * second, out-of-place h1.
 */
export function ResumeHeader({ contact }: ResumeHeaderProps) {
  const segments = buildContactSegments(contact);

  return (
    <header className="resume-doc__header">
      <h3 className="resume-doc__name">{contact.fullName}</h3>
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
