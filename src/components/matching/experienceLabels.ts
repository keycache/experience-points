import type { CareerProfile, Experience } from '../../schemas/careerProfile';

/** Resolves an experience id to a short "Company — Role" label for display. */
export function describeExperience(experience: Experience): string {
  return `${experience.company} — ${experience.role}`;
}

export function findExperienceById(
  careerProfile: CareerProfile,
  id: string,
): Experience | undefined {
  return careerProfile.experience.find((experience) => experience.id === id);
}
