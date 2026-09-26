import { z } from 'zod';

/**
 * The schema version this build of the application understands.
 *
 * Imported artifacts declaring a different `schema_version` must be
 * rejected with a clear error rather than coerced or silently accepted.
 * See specification.md section 13 (Import/Export).
 */
export const CURRENT_SCHEMA_VERSION = '1.0';

/**
 * Employment/education/etc. dates are month/year only (see
 * specification.md section 8.1), e.g. "Mar 2021". Storing month/year as
 * numbers (rather than a free-form string) keeps the value unambiguous
 * and makes downstream duration calculations (e.g. years of experience
 * for writing-style extrapolation) straightforward.
 */
export const MonthYearSchema = z.object({
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(1900).max(2100),
});

export type MonthYear = z.infer<typeof MonthYearSchema>;

/**
 * A single labeled link, e.g. a personal website or a portfolio page
 * that isn't one of the explicitly named contact fields.
 */
export const LinkSchema = z.object({
  label: z.string().min(1),
  url: z.string().url(),
});

export type Link = z.infer<typeof LinkSchema>;

/**
 * Contact information shared by the Career Profile, Resume, and Cover
 * Letter (specification.md section 16, "Contact Information").
 */
export const ContactInfoSchema = z.object({
  fullName: z.string().min(1),
  location: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  website: z.string().url().optional(),
  github: z.string().url().optional(),
  linkedin: z.string().url().optional(),
  otherLinks: z.array(LinkSchema).default([]),
});

export type ContactInfo = z.infer<typeof ContactInfoSchema>;

/**
 * Builds the standard export/import envelope described in
 * specification.md section 13:
 *
 * ```json
 * {
 *   "schema_version": "1.0",
 *   "type": "career-profile",
 *   "data": {}
 * }
 * ```
 *
 * The `type` and `schema_version` fields are validated as literals so
 * that importing a JSON file with the wrong artifact type, or an
 * unsupported schema version, fails validation instead of being
 * silently accepted.
 */
export function createExportEnvelopeSchema<
  Type extends string,
  DataSchema extends z.ZodTypeAny,
>(type: Type, dataSchema: DataSchema) {
  return z.object({
    schema_version: z.literal(CURRENT_SCHEMA_VERSION),
    type: z.literal(type),
    data: dataSchema,
  });
}

export type ExportEnvelope<
  Type extends string,
  Data,
> = {
  schema_version: typeof CURRENT_SCHEMA_VERSION;
  type: Type;
  data: Data;
};
