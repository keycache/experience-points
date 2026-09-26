import { z } from 'zod';
import { createExportEnvelopeSchema } from './common';

/**
 * Job Description domain schema.
 *
 * See specification.md section 8.2 (Job Description).
 */

export const JobDescriptionMetadataSchema = z.object({
  company: z.string().optional(),
  title: z.string().min(1),
  location: z.string().optional(),
});

export type JobDescriptionMetadata = z.infer<typeof JobDescriptionMetadataSchema>;

export const JobDescriptionSchema = z.object({
  metadata: JobDescriptionMetadataSchema,
  summary: z.string().optional(),
  responsibilities: z.array(z.string()).default([]),
  requirements: z.array(z.string()).default([]),
  preferredQualifications: z.array(z.string()).default([]),
  technologies: z.array(z.string()).default([]),
  leadershipExpectations: z.array(z.string()).default([]),
  domainSignals: z.array(z.string()).default([]),
  otherSignals: z.array(z.string()).default([]),
});

export type JobDescription = z.infer<typeof JobDescriptionSchema>;

export const JobDescriptionEnvelopeSchema = createExportEnvelopeSchema(
  'job-description',
  JobDescriptionSchema,
);

export type JobDescriptionEnvelope = z.infer<typeof JobDescriptionEnvelopeSchema>;
