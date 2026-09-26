import { z } from 'zod';

/**
 * Matching Analysis domain schema.
 *
 * See specification.md section 8.4 (Matching Analysis). Intentionally
 * avoids a large taxonomy of match types (e.g.
 * exact/partial/transferable/no-evidence) in favor of a small number of
 * practically useful fields.
 */

export const EquivalentTechnologySchema = z.object({
  jdTechnology: z.string().min(1),
  profileTechnology: z.string().min(1),
  rationale: z.string().optional(),
});

export type EquivalentTechnology = z.infer<typeof EquivalentTechnologySchema>;

export const MatchingAnalysisSchema = z.object({
  importantRequirements: z.array(z.string()).default([]),
  /** References Career Profile experience/project/accomplishment ids. */
  relevantExperienceIds: z.array(z.string()).default([]),
  importantTechnologies: z.array(z.string()).default([]),
  equivalentTechnologies: z.array(EquivalentTechnologySchema).default([]),
  missingEvidence: z.array(z.string()).default([]),
  suggestedOrdering: z.array(z.string()).default([]),
  suggestedSkills: z.array(z.string()).default([]),
});

export type MatchingAnalysis = z.infer<typeof MatchingAnalysisSchema>;
