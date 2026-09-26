import type { ContactInfo } from '../../schemas/common';
import type { Resume } from '../../schemas/resume';
import type { ResumeTemplate } from '../../schemas/resumeTemplate';
import { DEFAULT_RESUME_TEMPLATE, getContentWidthPt } from '../../components/resume-document/template';

/**
 * Layout estimation and block construction for the Resume live
 * preview / PDF renderer (plan.md Stage 11).
 *
 * jsdom (used by the automated tests) never performs real text
 * layout, and `@react-pdf/renderer` (Stage 12) needs page-break
 * decisions made *before* rendering rather than after. Both problems
 * are solved the same way: line counts and block heights are
 * estimated heuristically from string length and font metrics, not
 * measured from the rendered DOM. The estimate only drives pagination
 * decisions; actual visual wrapping is left to normal CSS
 * (`overflow-wrap: break-word`) in the components themselves.
 */

/** Rough average character width, as a fraction of font size, for a proportional sans-serif font. */
const AVERAGE_CHAR_WIDTH_FACTOR = 0.52;

/**
 * Real word-wrapping (both the browser's and `@react-pdf/renderer`'s)
 * breaks at the last whole word that fits a line, which always uses
 * somewhat less than the full line width. A naive character-count
 * division assumes every line is packed edge-to-edge, systematically
 * *under*-estimating line (and therefore page) counts relative to
 * real rendering. Applying a small safety margin here keeps the
 * pagination estimate on the conservative side, which matters most
 * for plan.md Stage 13's page-count compression: a target that looks
 * achievable in the estimate but is not in the real renderer would
 * silently produce more physical pages than predicted.
 */
const LAYOUT_ESTIMATE_SAFETY_MARGIN = 0.9;

export function estimateCharsPerLine(widthPt: number, fontSizePt: number): number {
  const charWidthPt = fontSizePt * AVERAGE_CHAR_WIDTH_FACTOR;
  return Math.max(1, Math.floor((widthPt * LAYOUT_ESTIMATE_SAFETY_MARGIN) / charWidthPt));
}

export function estimateLineCount(text: string, widthPt: number, fontSizePt: number): number {
  const trimmed = text.trim();
  if (trimmed.length === 0) {
    return 0;
  }
  const charsPerLine = estimateCharsPerLine(widthPt, fontSizePt);
  return Math.max(1, Math.ceil(trimmed.length / charsPerLine));
}

function textHeightPt(text: string, template: ResumeTemplate, widthPt: number): number {
  const lines = estimateLineCount(text, widthPt, template.baseFontSizePt);
  return lines * template.baseFontSizePt * template.lineHeight;
}

/** The Resume sections that are rendered as a heading followed by a flat list of entries. */
export type ResumeEntrySectionKey =
  | 'education'
  | 'certifications'
  | 'projects'
  | 'awards'
  | 'publications'
  | 'volunteerExperience'
  | 'professionalAffiliations';

/** A single unit of resume content that pagination places as a whole onto one page. */
export type ResumeLayoutBlock =
  | { kind: 'header'; heightPt: number }
  | { kind: 'section-heading'; sectionKey: string; title: string; heightPt: number }
  | { kind: 'summary-body'; text: string; heightPt: number }
  | { kind: 'skills-body'; skills: string[]; heightPt: number }
  /** Role heading combined with its first bullet; never split across pages. */
  | { kind: 'experience-role-start'; experienceId: string; firstBulletIndex: number; heightPt: number }
  /** The role's remaining bullets (index 1+), kept together as one unit where possible. */
  | { kind: 'experience-role-rest'; experienceId: string; fromBulletIndex: number; heightPt: number }
  | { kind: 'entry'; sectionKey: ResumeEntrySectionKey; itemId: string; heightPt: number }
  | { kind: 'custom-section-heading'; itemId: string; title: string; heightPt: number }
  | { kind: 'custom-section-body'; itemId: string; text: string; heightPt: number };

const SECTION_HEADING_HEIGHT_FACTOR = 1.6;
const ENTRY_HEIGHT_PT = 26;
const ROLE_HEADER_HEIGHT_PT = 28;
/**
 * Horizontal space consumed by the bullet marker/indent in both
 * renderers (the web preview's `.resume-doc__bullets` list indent and
 * the PDF renderer's `styles.bulletMarker` column). Bullet text wraps
 * within `contentWidthPt - BULLET_TEXT_INDENT_PT`, not the full
 * section width -- omitting this consistently under-estimated bullet
 * line counts for bullet-heavy resumes.
 */
const BULLET_TEXT_INDENT_PT = 12;

function contactLineText(contact: ContactInfo): string {
  const parts = [contact.location, contact.email, contact.phone, contact.website, contact.github, contact.linkedin];
  return parts.filter((part): part is string => Boolean(part)).join(' | ');
}

function sectionHeadingBlock(
  sectionKey: string,
  title: string,
  template: ResumeTemplate,
): ResumeLayoutBlock {
  return {
    kind: 'section-heading',
    sectionKey,
    title,
    heightPt: template.headingFontSizePt * template.lineHeight * SECTION_HEADING_HEIGHT_FACTOR,
  };
}

/**
 * Builds the ordered, paginatable content blocks for a Resume. Empty
 * sections (no data) produce no blocks at all, so pagination and
 * rendering never need to special-case "empty" — an omitted section
 * simply never appears.
 */
export function buildResumeLayoutBlocks(
  resume: Resume,
  template: ResumeTemplate = DEFAULT_RESUME_TEMPLATE,
): ResumeLayoutBlock[] {
  const blocks: ResumeLayoutBlock[] = [];
  const contentWidthPt = getContentWidthPt(template);

  const contactLine = contactLineText(resume.contact);
  const headerHeightPt =
    template.headingFontSizePt * 1.4 * template.lineHeight +
    (contactLine ? textHeightPt(contactLine, template, contentWidthPt) : 0) +
    template.sectionSpacingPt;
  blocks.push({ kind: 'header', heightPt: headerHeightPt });

  if (resume.profileSummary && resume.profileSummary.trim().length > 0) {
    blocks.push(sectionHeadingBlock('summary', 'Profile Summary', template));
    blocks.push({
      kind: 'summary-body',
      text: resume.profileSummary,
      heightPt: textHeightPt(resume.profileSummary, template, contentWidthPt),
    });
  }

  if (resume.skills.length > 0) {
    blocks.push(sectionHeadingBlock('skills', 'Skills', template));
    const skillsText = resume.skills.join('   •   ');
    blocks.push({
      kind: 'skills-body',
      skills: resume.skills,
      heightPt: textHeightPt(skillsText, template, contentWidthPt),
    });
  }

  if (resume.experience.length > 0) {
    blocks.push(sectionHeadingBlock('experience', 'Professional Experience', template));
    for (const role of resume.experience) {
      const roleHeaderText = `${role.company} ${role.role}`;
      const roleHeaderHeightPt = Math.max(
        ROLE_HEADER_HEIGHT_PT,
        textHeightPt(roleHeaderText, template, contentWidthPt) + template.sectionSpacingPt,
      );
      const bulletWidthPt = contentWidthPt - BULLET_TEXT_INDENT_PT;
      const firstBullet = role.bullets[0];
      const firstBulletHeightPt = firstBullet
        ? textHeightPt(firstBullet.text, template, bulletWidthPt)
        : 0;

      blocks.push({
        kind: 'experience-role-start',
        experienceId: role.id,
        firstBulletIndex: 0,
        heightPt: roleHeaderHeightPt + firstBulletHeightPt,
      });

      if (role.bullets.length > 1) {
        const restHeightPt = role.bullets
          .slice(1)
          .reduce((sum, bullet) => sum + textHeightPt(bullet.text, template, bulletWidthPt), 0);
        blocks.push({
          kind: 'experience-role-rest',
          experienceId: role.id,
          fromBulletIndex: 1,
          heightPt: restHeightPt,
        });
      }
    }
  }

  function pushEntrySection(sectionKey: ResumeEntrySectionKey, title: string, items: { id: string }[]) {
    if (items.length === 0) {
      return;
    }
    blocks.push(sectionHeadingBlock(sectionKey, title, template));
    for (const item of items) {
      blocks.push({ kind: 'entry', sectionKey, itemId: item.id, heightPt: ENTRY_HEIGHT_PT });
    }
  }

  pushEntrySection('education', 'Education', resume.education);
  pushEntrySection('certifications', 'Certifications', resume.certifications);
  pushEntrySection('projects', 'Projects', resume.projects);
  pushEntrySection('awards', 'Awards', resume.awards);
  pushEntrySection('publications', 'Publications', resume.publications);
  pushEntrySection('volunteerExperience', 'Volunteer Experience', resume.volunteerExperience);
  pushEntrySection('professionalAffiliations', 'Professional Affiliations', resume.professionalAffiliations);

  for (const customSection of resume.customSections) {
    blocks.push({
      kind: 'custom-section-heading',
      itemId: customSection.id,
      title: customSection.title,
      heightPt: template.headingFontSizePt * template.lineHeight * SECTION_HEADING_HEIGHT_FACTOR,
    });
    blocks.push({
      kind: 'custom-section-body',
      itemId: customSection.id,
      text: customSection.content,
      heightPt: textHeightPt(customSection.content, template, contentWidthPt),
    });
  }

  return blocks;
}
