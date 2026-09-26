import type { ContactInfo } from '../../schemas/common';

function contactSegments(contact: ContactInfo): { key: string; label: string; href?: string }[] {
  const segments: { key: string; label: string; href?: string }[] = [];

  if (contact.location) {
    segments.push({ key: 'location', label: contact.location });
  }
  if (contact.email) {
    segments.push({ key: 'email', label: contact.email, href: `mailto:${contact.email}` });
  }
  if (contact.phone) {
    segments.push({ key: 'phone', label: contact.phone, href: `tel:${contact.phone}` });
  }
  if (contact.website) {
    segments.push({ key: 'website', label: 'Website', href: contact.website });
  }
  if (contact.github) {
    segments.push({ key: 'github', label: 'GitHub', href: contact.github });
  }
  if (contact.linkedin) {
    segments.push({ key: 'linkedin', label: 'LinkedIn', href: contact.linkedin });
  }
  for (const link of contact.otherLinks) {
    segments.push({ key: `other-${link.url}`, label: link.label, href: link.url });
  }

  return segments;
}

interface ResumeHeaderProps {
  contact: ContactInfo;
}

/**
 * Centered contact/header area (specification.md section 14). All
 * profile links remain clickable (section 16, "Contact Information").
 */
export function ResumeHeader({ contact }: ResumeHeaderProps) {
  const segments = contactSegments(contact);

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
