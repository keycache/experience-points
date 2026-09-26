import { z } from 'zod';
import { ContactInfoSchema, MonthYearSchema, createExportEnvelopeSchema } from './common';

/**
 * Career Profile domain schemas.
 *
 * See specification.md section 8.1 (Career Profile) and plan.md
 * Stage 1 for the supported sections. The Career Profile is a career
 * knowledge base, not a resume: it is intentionally allowed to hold
 * substantially more information than any single generated Resume.
 */

export const AccomplishmentSchema = z.object({
  id: z.string().min(1),
  description: z.string().min(1),
  technologies: z.array(z.string()).default([]),
  impact: z.string().optional(),
  scale: z.string().optional(),
});

export type Accomplishment = z.infer<typeof AccomplishmentSchema>;

export const ProjectSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  accomplishments: z.array(AccomplishmentSchema).default([]),
  technologies: z.array(z.string()).default([]),
});

export type Project = z.infer<typeof ProjectSchema>;

export const ExperienceSchema = z.object({
  id: z.string().min(1),
  company: z.string().min(1),
  role: z.string().min(1),
  location: z.string().optional(),
  startDate: MonthYearSchema,
  /** Omit endDate (and set isCurrent) to represent an ongoing role. */
  endDate: MonthYearSchema.optional(),
  isCurrent: z.boolean().default(false),
  projects: z.array(ProjectSchema).default([]),
  technologies: z.array(z.string()).default([]),
});

export type Experience = z.infer<typeof ExperienceSchema>;

export const SkillSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  category: z.string().optional(),
});

export type Skill = z.infer<typeof SkillSchema>;

export const EducationSchema = z.object({
  id: z.string().min(1),
  institution: z.string().min(1),
  degree: z.string().optional(),
  fieldOfStudy: z.string().optional(),
  startDate: MonthYearSchema.optional(),
  endDate: MonthYearSchema.optional(),
  details: z.string().optional(),
});

export type Education = z.infer<typeof EducationSchema>;

export const CertificationSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  issuer: z.string().optional(),
  dateAwarded: MonthYearSchema.optional(),
  expirationDate: MonthYearSchema.optional(),
  credentialUrl: z.string().url().optional(),
});

export type Certification = z.infer<typeof CertificationSchema>;

export const AwardSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  issuer: z.string().optional(),
  date: MonthYearSchema.optional(),
  description: z.string().optional(),
});

export type Award = z.infer<typeof AwardSchema>;

export const PublicationSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  publisher: z.string().optional(),
  date: MonthYearSchema.optional(),
  url: z.string().url().optional(),
  description: z.string().optional(),
});

export type Publication = z.infer<typeof PublicationSchema>;

export const VolunteerExperienceSchema = z.object({
  id: z.string().min(1),
  organization: z.string().min(1),
  role: z.string().optional(),
  startDate: MonthYearSchema.optional(),
  endDate: MonthYearSchema.optional(),
  description: z.string().optional(),
});

export type VolunteerExperience = z.infer<typeof VolunteerExperienceSchema>;

export const ProfessionalAffiliationSchema = z.object({
  id: z.string().min(1),
  organization: z.string().min(1),
  role: z.string().optional(),
  startDate: MonthYearSchema.optional(),
  endDate: MonthYearSchema.optional(),
});

export type ProfessionalAffiliation = z.infer<typeof ProfessionalAffiliationSchema>;

export const CustomSectionSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  content: z.string().min(1),
});

export type CustomSection = z.infer<typeof CustomSectionSchema>;

export const CareerProfileSchema = z.object({
  personal: ContactInfoSchema,
  /** Free-form raw text the profile summary was originally derived from. */
  professionalSummarySource: z.string().optional(),
  experience: z.array(ExperienceSchema).default([]),
  skills: z.array(SkillSchema).default([]),
  education: z.array(EducationSchema).default([]),
  certifications: z.array(CertificationSchema).default([]),
  awards: z.array(AwardSchema).default([]),
  publications: z.array(PublicationSchema).default([]),
  projects: z.array(ProjectSchema).default([]),
  volunteerExperience: z.array(VolunteerExperienceSchema).default([]),
  professionalAffiliations: z.array(ProfessionalAffiliationSchema).default([]),
  customSections: z.array(CustomSectionSchema).default([]),
});

export type CareerProfile = z.infer<typeof CareerProfileSchema>;

export const CareerProfileEnvelopeSchema = createExportEnvelopeSchema(
  'career-profile',
  CareerProfileSchema,
);

export type CareerProfileEnvelope = z.infer<typeof CareerProfileEnvelopeSchema>;
