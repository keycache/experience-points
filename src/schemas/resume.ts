import { z } from 'zod';
import { ContactInfoSchema, MonthYearSchema, createExportEnvelopeSchema } from './common';

/**
 * Resume domain schema.
 *
 * See specification.md section 8.5 (Resume) and section 15 (PDF Layout
 * Rules) for the page-count preference. The Resume is intentionally
 * independent of the Career Profile: editing a Resume never mutates the
 * Career Profile it was generated from (plan.md Stage 10).
 */

export const ResumeBulletSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
});

export type ResumeBullet = z.infer<typeof ResumeBulletSchema>;

/** plan.md Stage 1: "maximum bullets per role = 6". */
export const MAX_BULLETS_PER_ROLE = 6;

export const ResumeExperienceSchema = z.object({
  id: z.string().min(1),
  company: z.string().min(1),
  role: z.string().min(1),
  location: z.string().optional(),
  startDate: MonthYearSchema,
  endDate: MonthYearSchema.optional(),
  isCurrent: z.boolean().default(false),
  bullets: z
    .array(ResumeBulletSchema)
    .max(MAX_BULLETS_PER_ROLE, `A role may have at most ${MAX_BULLETS_PER_ROLE} bullets`)
    .default([]),
});

export type ResumeExperience = z.infer<typeof ResumeExperienceSchema>;

export const ResumeEducationSchema = z.object({
  id: z.string().min(1),
  institution: z.string().min(1),
  degree: z.string().optional(),
  fieldOfStudy: z.string().optional(),
  startDate: MonthYearSchema.optional(),
  endDate: MonthYearSchema.optional(),
  details: z.string().optional(),
});

export type ResumeEducation = z.infer<typeof ResumeEducationSchema>;

export const ResumeCertificationSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  issuer: z.string().optional(),
  dateAwarded: MonthYearSchema.optional(),
});

export type ResumeCertification = z.infer<typeof ResumeCertificationSchema>;

export const ResumeProjectSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  technologies: z.array(z.string()).default([]),
});

export type ResumeProject = z.infer<typeof ResumeProjectSchema>;

export const ResumeAwardSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  issuer: z.string().optional(),
  date: MonthYearSchema.optional(),
});

export type ResumeAward = z.infer<typeof ResumeAwardSchema>;

export const ResumePublicationSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  publisher: z.string().optional(),
  url: z.string().url().optional(),
});

export type ResumePublication = z.infer<typeof ResumePublicationSchema>;

export const ResumeVolunteerExperienceSchema = z.object({
  id: z.string().min(1),
  organization: z.string().min(1),
  role: z.string().optional(),
  description: z.string().optional(),
});

export type ResumeVolunteerExperience = z.infer<typeof ResumeVolunteerExperienceSchema>;

export const ResumeProfessionalAffiliationSchema = z.object({
  id: z.string().min(1),
  organization: z.string().min(1),
  role: z.string().optional(),
});

export type ResumeProfessionalAffiliation = z.infer<typeof ResumeProfessionalAffiliationSchema>;

export const ResumeCustomSectionSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  content: z.string().min(1),
});

export type ResumeCustomSection = z.infer<typeof ResumeCustomSectionSchema>;

/**
 * specification.md section 15: page-count preference defaults to "no
 * preference" and otherwise names an explicit number of pages.
 */
export const PageCountPreferenceSchema = z.union([
  z.literal('no-preference'),
  z.number().int().min(1),
]);

export type PageCountPreference = z.infer<typeof PageCountPreferenceSchema>;

export const ResumeConstraintsSchema = z.object({
  maxBulletsPerRole: z.number().int().min(1).default(MAX_BULLETS_PER_ROLE),
  targetBulletsPerRole: z
    .object({
      min: z.number().int().min(1).default(4),
      max: z.number().int().min(1).default(6),
    })
    .default({ min: 4, max: 6 }),
  maxSentencesPerBullet: z.number().int().min(1).default(4),
  pageCountPreference: PageCountPreferenceSchema.default('no-preference'),
});

export type ResumeConstraints = z.infer<typeof ResumeConstraintsSchema>;

export const ResumeSchema = z.object({
  contact: ContactInfoSchema,
  profileSummary: z.string().optional(),
  skills: z.array(z.string()).default([]),
  experience: z.array(ResumeExperienceSchema).default([]),
  education: z.array(ResumeEducationSchema).default([]),
  certifications: z.array(ResumeCertificationSchema).default([]),
  projects: z.array(ResumeProjectSchema).default([]),
  awards: z.array(ResumeAwardSchema).default([]),
  publications: z.array(ResumePublicationSchema).default([]),
  volunteerExperience: z.array(ResumeVolunteerExperienceSchema).default([]),
  professionalAffiliations: z.array(ResumeProfessionalAffiliationSchema).default([]),
  customSections: z.array(ResumeCustomSectionSchema).default([]),
  constraints: ResumeConstraintsSchema.default({
    maxBulletsPerRole: MAX_BULLETS_PER_ROLE,
    targetBulletsPerRole: { min: 4, max: 6 },
    maxSentencesPerBullet: 4,
    pageCountPreference: 'no-preference',
  }),
});

export type Resume = z.infer<typeof ResumeSchema>;

export const ResumeEnvelopeSchema = createExportEnvelopeSchema('resume', ResumeSchema);

export type ResumeEnvelope = z.infer<typeof ResumeEnvelopeSchema>;
