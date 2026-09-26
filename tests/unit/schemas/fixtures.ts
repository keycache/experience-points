import type { CareerProfile } from '../../../src/schemas/careerProfile';

/**
 * A minimal-but-realistic valid Career Profile fixture reused across
 * schema tests.
 */
export function buildValidCareerProfile(): CareerProfile {
  return {
    personal: {
      fullName: 'Jamie Rivera',
      location: 'Austin, TX',
      email: 'jamie.rivera@example.com',
      otherLinks: [],
    },
    professionalSummarySource: 'Platform engineer with 8 years of experience.',
    experience: [
      {
        id: 'exp-1',
        company: 'Initech',
        role: 'Senior Platform Engineer',
        startDate: { month: 3, year: 2021 },
        isCurrent: true,
        projects: [
          {
            id: 'proj-1',
            name: 'Infra Migration',
            description: 'Migrated infrastructure to OpenTofu.',
            accomplishments: [
              {
                id: 'acc-1',
                description: 'Led migration of Terraform stacks to OpenTofu.',
                technologies: ['OpenTofu', 'AWS'],
                impact: 'Reduced licensing cost by 100%.',
                scale: '40 services',
              },
            ],
            technologies: ['OpenTofu', 'AWS'],
          },
        ],
        technologies: ['OpenTofu', 'AWS', 'Docker'],
      },
    ],
    skills: [{ id: 'skill-1', name: 'Python', category: 'Languages' }],
    education: [
      {
        id: 'edu-1',
        institution: 'University of Texas',
        degree: 'B.S. Computer Science',
      },
    ],
    certifications: [],
    awards: [],
    publications: [],
    projects: [],
    volunteerExperience: [],
    professionalAffiliations: [],
    customSections: [],
  };
}
