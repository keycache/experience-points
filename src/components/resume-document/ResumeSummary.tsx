interface ResumeSectionHeadingProps {
  title: string;
}

/** A strong section heading, shared by every resume section (specification.md section 14). */
export function ResumeSectionHeading({ title }: ResumeSectionHeadingProps) {
  return <h2 className="resume-doc__section-heading">{title}</h2>;
}

interface ResumeSummaryProps {
  text: string;
}

/** Profile Summary section body. */
export function ResumeSummary({ text }: ResumeSummaryProps) {
  return <p className="resume-doc__summary">{text}</p>;
}
