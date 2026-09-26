import { generateId } from '../../utils/ids';
import type {
  Accomplishment,
  CareerProfile,
  Experience,
  Project,
} from '../../schemas/careerProfile';

/**
 * Replaces every nested `id` field in a Career Profile with a freshly
 * generated id.
 *
 * LLM-produced ids are only required to be non-empty strings (see
 * `extract-career-profile.ts`); they are not guaranteed to be globally
 * unique or stable. Reassigning ids after validation guarantees the
 * application always has unique, collision-free identifiers to use as
 * React keys and for targeted edits, regardless of what the model
 * returned.
 */
function withFreshId<T extends { id: string }>(item: T): T {
  return { ...item, id: generateId() };
}

function refreshAccomplishment(accomplishment: Accomplishment): Accomplishment {
  return withFreshId(accomplishment);
}

function refreshProject(project: Project): Project {
  return withFreshId({
    ...project,
    accomplishments: project.accomplishments.map(refreshAccomplishment),
  });
}

function refreshExperience(experience: Experience): Experience {
  return withFreshId({ ...experience, projects: experience.projects.map(refreshProject) });
}

export function assignFreshIds(profile: CareerProfile): CareerProfile {
  return {
    ...profile,
    experience: profile.experience.map(refreshExperience),
    projects: profile.projects.map(refreshProject),
    skills: profile.skills.map(withFreshId),
    education: profile.education.map(withFreshId),
    certifications: profile.certifications.map(withFreshId),
    awards: profile.awards.map(withFreshId),
    publications: profile.publications.map(withFreshId),
    volunteerExperience: profile.volunteerExperience.map(withFreshId),
    professionalAffiliations: profile.professionalAffiliations.map(withFreshId),
    customSections: profile.customSections.map(withFreshId),
  };
}
