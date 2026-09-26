import { generateId } from '../../utils/ids';
import type { Resume, ResumeBullet, ResumeExperience } from '../../schemas/resume';

/**
 * Replaces every nested `id` field in a generated Resume with a freshly
 * generated id, mirroring `assignFreshIds` for the Career Profile
 * (Stage 5): LLM-produced ids are only guaranteed to be non-empty
 * strings, not unique or stable, so the application always reassigns
 * its own ids before the result enters application state.
 */
function withFreshId<T extends { id: string }>(item: T): T {
  return { ...item, id: generateId() };
}

function refreshBullet(bullet: ResumeBullet): ResumeBullet {
  return withFreshId(bullet);
}

function refreshExperience(experience: ResumeExperience): ResumeExperience {
  return withFreshId({ ...experience, bullets: experience.bullets.map(refreshBullet) });
}

export function assignFreshResumeIds(resume: Resume): Resume {
  return {
    ...resume,
    experience: resume.experience.map(refreshExperience),
    education: resume.education.map(withFreshId),
    certifications: resume.certifications.map(withFreshId),
    projects: resume.projects.map(withFreshId),
    awards: resume.awards.map(withFreshId),
    publications: resume.publications.map(withFreshId),
    volunteerExperience: resume.volunteerExperience.map(withFreshId),
    professionalAffiliations: resume.professionalAffiliations.map(withFreshId),
    customSections: resume.customSections.map(withFreshId),
  };
}
