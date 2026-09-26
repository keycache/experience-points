import type { CareerProfile } from '../../schemas/careerProfile';
import type { MatchingAnalysis } from '../../schemas/matching';
import { describeExperience, findExperienceById } from './experienceLabels';

interface MatchingAnalysisViewProps {
  matching: MatchingAnalysis;
  careerProfile: CareerProfile;
}

/**
 * Read-only display of the generated Matching Analysis
 * (specification.md section 8.4). Deliberately avoids exposing the
 * model's internal match-type taxonomy; just shows the practically
 * useful lists the user can act on.
 */
export function MatchingAnalysisView({ matching, careerProfile }: MatchingAnalysisViewProps) {
  return (
    <div className="matching-analysis-view">
      <section className="list-editor">
        <h3>Important JD requirements</h3>
        {matching.importantRequirements.length === 0 ? (
          <p className="list-editor__empty">None identified.</p>
        ) : (
          <ul>
            {matching.importantRequirements.map((requirement) => (
              <li key={requirement}>{requirement}</li>
            ))}
          </ul>
        )}
      </section>

      <section className="list-editor">
        <h3>Important technologies</h3>
        {matching.importantTechnologies.length === 0 ? (
          <p className="list-editor__empty">None identified.</p>
        ) : (
          <ul>
            {matching.importantTechnologies.map((technology) => (
              <li key={technology}>{technology}</li>
            ))}
          </ul>
        )}
      </section>

      <section className="list-editor">
        <h3>Equivalent technology opportunities</h3>
        {matching.equivalentTechnologies.length === 0 ? (
          <p className="list-editor__empty">None identified.</p>
        ) : (
          <ul>
            {matching.equivalentTechnologies.map((equivalence) => (
              <li key={`${equivalence.jdTechnology}-${equivalence.profileTechnology}`}>
                JD asks for <strong>{equivalence.jdTechnology}</strong>; your{' '}
                <strong>{equivalence.profileTechnology}</strong> experience may support it.
                {equivalence.rationale ? ` (${equivalence.rationale})` : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="list-editor">
        <h3>Missing evidence</h3>
        {matching.missingEvidence.length === 0 ? (
          <p className="list-editor__empty">
            No unsupported requirements identified &mdash; nothing will be fabricated.
          </p>
        ) : (
          <ul>
            {matching.missingEvidence.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        )}
      </section>

      <section className="list-editor">
        <h3>Suggested skills to emphasize</h3>
        {matching.suggestedSkills.length === 0 ? (
          <p className="list-editor__empty">None identified.</p>
        ) : (
          <ul>
            {matching.suggestedSkills.map((skill) => (
              <li key={skill}>{skill}</li>
            ))}
          </ul>
        )}
      </section>

      <section className="list-editor">
        <h3>Suggested ordering</h3>
        {matching.suggestedOrdering.length === 0 ? (
          <p className="list-editor__empty">None identified.</p>
        ) : (
          <ol>
            {matching.suggestedOrdering.map((experienceId) => {
              const experience = findExperienceById(careerProfile, experienceId);
              return <li key={experienceId}>{experience ? describeExperience(experience) : experienceId}</li>;
            })}
          </ol>
        )}
      </section>
    </div>
  );
}
