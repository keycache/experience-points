interface ResumeSkillsProps {
  skills: string[];
}

/**
 * Skills/technical information section. Uses a "table-like" wrapped
 * inline list (specification.md section 14: "Table-like presentation
 * where required") rather than one long comma-separated sentence.
 */
export function ResumeSkills({ skills }: ResumeSkillsProps) {
  return (
    <ul className="resume-doc__skills">
      {skills.map((skill) => (
        <li key={skill} className="resume-doc__skill">
          {skill}
        </li>
      ))}
    </ul>
  );
}
