import type { ReactNode } from 'react';
import type { Resume } from '../../schemas/resume';
import type { ResumeTemplate } from '../../schemas/resumeTemplate';
import type { ResumeLayoutBlock } from '../../services/resume-preview/layoutBlocks';
import { paginateResume } from '../../services/resume-preview/paginateResume';
import { DEFAULT_RESUME_TEMPLATE, PAGE_HEIGHT_PT, PAGE_WIDTH_PT, ptToPx } from './template';
import { ResumeHeader } from './ResumeHeader';
import { ResumeSectionHeading, ResumeSummary } from './ResumeSummary';
import { ResumeSkills } from './ResumeSkills';
import { ResumeExperienceRoleRest, ResumeExperienceRoleStart } from './ResumeExperience';
import { ResumeEducationEntry } from './ResumeEducation';
import {
  ResumeAffiliationEntry,
  ResumeAwardEntry,
  ResumeCertificationEntry,
  ResumeProjectEntry,
  ResumePublicationEntry,
  ResumeVolunteerEntry,
} from './ResumeAdditionalSections';

interface ResumeDocumentProps {
  resume: Resume;
  template?: ResumeTemplate;
}

function findById<T extends { id: string }>(items: T[], id: string): T | undefined {
  return items.find((item) => item.id === id);
}

function renderBlock(block: ResumeLayoutBlock, resume: Resume): ReactNode {
  switch (block.kind) {
    case 'header':
      return <ResumeHeader contact={resume.contact} />;
    case 'section-heading':
      return <ResumeSectionHeading title={block.title} />;
    case 'summary-body':
      return <ResumeSummary text={block.text} />;
    case 'skills-body':
      return <ResumeSkills skills={block.skills} />;
    case 'experience-role-start': {
      const experience = findById(resume.experience, block.experienceId);
      return experience ? <ResumeExperienceRoleStart experience={experience} /> : null;
    }
    case 'experience-role-rest': {
      const experience = findById(resume.experience, block.experienceId);
      return experience ? (
        <ResumeExperienceRoleRest experience={experience} fromBulletIndex={block.fromBulletIndex} />
      ) : null;
    }
    case 'entry': {
      switch (block.sectionKey) {
        case 'education': {
          const item = findById(resume.education, block.itemId);
          return item ? <ResumeEducationEntry education={item} /> : null;
        }
        case 'certifications': {
          const item = findById(resume.certifications, block.itemId);
          return item ? <ResumeCertificationEntry certification={item} /> : null;
        }
        case 'projects': {
          const item = findById(resume.projects, block.itemId);
          return item ? <ResumeProjectEntry project={item} /> : null;
        }
        case 'awards': {
          const item = findById(resume.awards, block.itemId);
          return item ? <ResumeAwardEntry award={item} /> : null;
        }
        case 'publications': {
          const item = findById(resume.publications, block.itemId);
          return item ? <ResumePublicationEntry publication={item} /> : null;
        }
        case 'volunteerExperience': {
          const item = findById(resume.volunteerExperience, block.itemId);
          return item ? <ResumeVolunteerEntry entry={item} /> : null;
        }
        case 'professionalAffiliations': {
          const item = findById(resume.professionalAffiliations, block.itemId);
          return item ? <ResumeAffiliationEntry entry={item} /> : null;
        }
        default:
          return null;
      }
    }
    case 'custom-section-heading':
      return <ResumeSectionHeading title={block.title} />;
    case 'custom-section-body':
      return <p className="resume-doc__entry-details">{block.text}</p>;
    default:
      return null;
  }
}

/**
 * Renders a Resume as a paginated document (plan.md Stage 11).
 *
 * The same `paginateResume` call that will drive the PDF renderer in
 * Stage 12 is used here for the live preview, so the two stay visually
 * consistent (specification.md section 3.4: "The preview should use
 * the same rendering model where practical").
 */
export function ResumeDocument({ resume, template = DEFAULT_RESUME_TEMPLATE }: ResumeDocumentProps) {
  const pages = paginateResume(resume, template);

  return (
    <div
      className="resume-doc"
      style={{ ['--resume-doc-font-family' as string]: template.fontFamily }}
    >
      {pages.map((page, pageIndex) => (
        <section
          key={pageIndex}
          className="resume-page"
          aria-label={`Resume page ${pageIndex + 1} of ${pages.length}`}
          style={{
            width: ptToPx(PAGE_WIDTH_PT),
            minHeight: ptToPx(PAGE_HEIGHT_PT),
            paddingTop: ptToPx(template.marginsPt.top),
            paddingRight: ptToPx(template.marginsPt.right),
            paddingBottom: ptToPx(template.marginsPt.bottom),
            paddingLeft: ptToPx(template.marginsPt.left),
            fontFamily: template.fontFamily,
            fontSize: ptToPx(template.baseFontSizePt),
            lineHeight: template.lineHeight,
          }}
        >
          {page.blocks.map((block, blockIndex) => (
            <div key={blockIndex}>{renderBlock(block, resume)}</div>
          ))}
        </section>
      ))}
    </div>
  );
}
