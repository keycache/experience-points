import type { ReactNode } from 'react';
import { Document, Page, View } from '@react-pdf/renderer';
import type { Resume } from '../../schemas/resume';
import type { ResumeTemplate } from '../../schemas/resumeTemplate';
import { DEFAULT_RESUME_TEMPLATE, PAGE_HEIGHT_PT, PAGE_WIDTH_PT } from '../resume-document/template';
import type { ResumeLayoutBlock } from '../../services/resume-preview/layoutBlocks';
import { paginateResume } from '../../services/resume-preview/paginateResume';
import { buildResumePdfStyles } from './styles';
import { ResumePdfHeader } from './ResumePdfHeader';
import { ResumePdfSectionHeading, ResumePdfSummary } from './ResumePdfSummary';
import { ResumePdfSkills } from './ResumePdfSkills';
import { ResumePdfExperienceRoleRest, ResumePdfExperienceRoleStart } from './ResumePdfExperience';
import { ResumePdfEducationEntry } from './ResumePdfEducation';
import {
  ResumePdfAffiliationEntry,
  ResumePdfAwardEntry,
  ResumePdfCertificationEntry,
  ResumePdfProjectEntry,
  ResumePdfPublicationEntry,
  ResumePdfVolunteerEntry,
} from './ResumePdfAdditionalSections';

interface ResumePdfDocumentProps {
  resume: Resume;
  template?: ResumeTemplate;
}

function findById<T extends { id: string }>(items: T[], id: string): T | undefined {
  return items.find((item) => item.id === id);
}

function renderBlock(
  block: ResumeLayoutBlock,
  resume: Resume,
  styles: ReturnType<typeof buildResumePdfStyles>,
): ReactNode {
  switch (block.kind) {
    case 'header':
      return <ResumePdfHeader contact={resume.contact} styles={styles} />;
    case 'section-heading':
      return <ResumePdfSectionHeading title={block.title} styles={styles} />;
    case 'summary-body':
      return <ResumePdfSummary text={block.text} styles={styles} />;
    case 'skills-body':
      return <ResumePdfSkills skills={block.skills} styles={styles} />;
    case 'experience-role-start': {
      const experience = findById(resume.experience, block.experienceId);
      return experience ? <ResumePdfExperienceRoleStart experience={experience} styles={styles} /> : null;
    }
    case 'experience-role-rest': {
      const experience = findById(resume.experience, block.experienceId);
      return experience ? (
        <ResumePdfExperienceRoleRest
          experience={experience}
          fromBulletIndex={block.fromBulletIndex}
          styles={styles}
        />
      ) : null;
    }
    case 'entry': {
      switch (block.sectionKey) {
        case 'education': {
          const item = findById(resume.education, block.itemId);
          return item ? <ResumePdfEducationEntry education={item} styles={styles} /> : null;
        }
        case 'certifications': {
          const item = findById(resume.certifications, block.itemId);
          return item ? <ResumePdfCertificationEntry certification={item} styles={styles} /> : null;
        }
        case 'projects': {
          const item = findById(resume.projects, block.itemId);
          return item ? <ResumePdfProjectEntry project={item} styles={styles} /> : null;
        }
        case 'awards': {
          const item = findById(resume.awards, block.itemId);
          return item ? <ResumePdfAwardEntry award={item} styles={styles} /> : null;
        }
        case 'publications': {
          const item = findById(resume.publications, block.itemId);
          return item ? <ResumePdfPublicationEntry publication={item} styles={styles} /> : null;
        }
        case 'volunteerExperience': {
          const item = findById(resume.volunteerExperience, block.itemId);
          return item ? <ResumePdfVolunteerEntry entry={item} styles={styles} /> : null;
        }
        case 'professionalAffiliations': {
          const item = findById(resume.professionalAffiliations, block.itemId);
          return item ? <ResumePdfAffiliationEntry entry={item} styles={styles} /> : null;
        }
        default:
          return null;
      }
    }
    case 'custom-section-heading':
      return <ResumePdfSectionHeading title={block.title} styles={styles} />;
    case 'custom-section-body':
      return <ResumePdfSummary text={block.text} styles={styles} />;
    default:
      return null;
  }
}

/**
 * The Resume PDF document (plan.md Stage 12; specification.md section
 * 3.4). Uses the exact same `paginateResume` call as the live preview
 * (`resume-document/ResumeDocument.tsx`, Stage 11), so pagination
 * decisions are identical between preview and export — only the
 * rendering primitives differ (`@react-pdf/renderer` components
 * instead of HTML).
 */
export function ResumePdfDocument({ resume, template = DEFAULT_RESUME_TEMPLATE }: ResumePdfDocumentProps) {
  const pages = paginateResume(resume, template);
  const styles = buildResumePdfStyles(template);

  return (
    <Document title={`${resume.contact.fullName} - Resume`}>
      {pages.map((page, pageIndex) => (
        <Page key={pageIndex} size={[PAGE_WIDTH_PT, PAGE_HEIGHT_PT]} style={styles.page}>
          {page.blocks.map((block, blockIndex) => (
            <View key={blockIndex}>{renderBlock(block, resume, styles)}</View>
          ))}
        </Page>
      ))}
    </Document>
  );
}
