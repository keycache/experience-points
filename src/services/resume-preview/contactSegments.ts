import type { ContactInfo } from '../../schemas/common';

export interface ContactSegment {
  key: string;
  label: string;
  href?: string;
}

/**
 * Derives the ordered list of displayable/clickable contact segments
 * for a Resume's header (specification.md section 16, "Contact
 * Information"). Shared by both the live preview
 * (`resume-document/ResumeHeader.tsx`) and the PDF renderer
 * (`resume-pdf/ResumePdfHeader.tsx`) so the two stay consistent and
 * this link-selection logic is unit-testable independent of either
 * rendering target.
 */
export function buildContactSegments(contact: ContactInfo): ContactSegment[] {
  const segments: ContactSegment[] = [];

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
