interface ResumeSectionHeadingProps {
  title: string;
}

/**
 * A strong section heading, shared by every resume section
 * (specification.md section 14). h4 because this always nests under
 * the Resume's own h3 name heading, which itself nests under the
 * Preview / Export step's h2 (plan.md Stage 16, "Semantic headings").
 */
export function ResumeSectionHeading({ title }: ResumeSectionHeadingProps) {
  return <h4 className="resume-doc__section-heading">{title}</h4>;
}

interface ResumeSummaryProps {
  text: string;
}

/** Profile Summary section body. */
export function ResumeSummary({ text }: ResumeSummaryProps) {
  return <p className="resume-doc__summary">{text}</p>;
}
