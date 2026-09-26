import type { Resume } from '../../schemas/resume';
import type { ResumeTemplate } from '../../schemas/resumeTemplate';
import { DEFAULT_RESUME_TEMPLATE, getContentHeightPt } from '../../components/resume-document/template';
import { buildResumeLayoutBlocks, type ResumeLayoutBlock } from './layoutBlocks';

export interface ResumePage {
  blocks: ResumeLayoutBlock[];
}

/**
 * Splits an ordered list of layout blocks into pages that fit within
 * `maxHeightPt`, following specification.md section 15 (PDF Layout
 * Rules):
 *
 * - A `section-heading` block is never left alone at the bottom of a
 *   page: if the block immediately following it would not also fit,
 *   both move to the next page together.
 * - Every other block (including the combined
 *   `experience-role-start` heading+first-bullet block, which is
 *   never split) is placed as a whole; if it does not fit in the
 *   remaining space, a new page starts before it.
 * - A single block larger than an entire page is still placed (on its
 *   own page) rather than looping forever — never destroying
 *   readability just to force a break that cannot help.
 */
export function paginateResumeBlocks(
  blocks: ResumeLayoutBlock[],
  maxHeightPt: number,
): ResumePage[] {
  const pages: ResumePage[] = [];
  let currentPage: ResumeLayoutBlock[] = [];
  let currentHeightPt = 0;

  function startNewPage() {
    if (currentPage.length > 0) {
      pages.push({ blocks: currentPage });
    }
    currentPage = [];
    currentHeightPt = 0;
  }

  for (let i = 0; i < blocks.length; i += 1) {
    const block = blocks[i];
    const nextBlock = blocks[i + 1];

    // Avoid leaving a section heading stranded alone at the bottom of
    // a page: require room for the heading *and* whatever comes next.
    const requiredHeightPt =
      block.kind === 'section-heading' && nextBlock
        ? block.heightPt + nextBlock.heightPt
        : block.heightPt;

    if (currentHeightPt > 0 && currentHeightPt + requiredHeightPt > maxHeightPt) {
      startNewPage();
    }

    currentPage.push(block);
    currentHeightPt += block.heightPt;
  }

  startNewPage();

  return pages;
}

/**
 * Builds the layout blocks for a Resume and paginates them, ready for
 * rendering by `ResumeDocument` (live preview) and, in Stage 12, the
 * PDF renderer.
 */
export function paginateResume(
  resume: Resume,
  template: ResumeTemplate = DEFAULT_RESUME_TEMPLATE,
): ResumePage[] {
  const blocks = buildResumeLayoutBlocks(resume, template);
  const maxHeightPt = getContentHeightPt(template);
  return paginateResumeBlocks(blocks, maxHeightPt);
}
