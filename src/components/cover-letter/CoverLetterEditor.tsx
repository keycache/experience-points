import type { CoverLetter } from '../../schemas/coverLetter';
import { LabeledTextField } from '../career-profile/fields';
import { CoverLetterRecipientEditor } from './CoverLetterRecipientEditor';
import { CoverLetterBodyParagraphsEditor } from './CoverLetterBodyParagraphsEditor';
import { buildContactSegments } from '../../services/resume-preview/contactSegments';

interface CoverLetterEditorProps {
  coverLetter: CoverLetter;
  onChange: (coverLetter: CoverLetter) => void;
}

/**
 * Top-level Cover Letter editor (plan.md Stage 14.5): recipient,
 * salutation, body paragraphs, closing. A pure controlled component,
 * mirroring `ResumeEditor`'s structure/pattern.
 *
 * `senderContact` is intentionally NOT independently editable here: it
 * is always synced from the Resume's contact at generation time
 * (specification.md section 8.6, "Sender contact (reused from Resume
 * contact)") and preserved verbatim on import, so editing it here
 * separately would risk it drifting out of sync with the Resume. A
 * read-only summary is shown instead for visibility.
 */
export function CoverLetterEditor({ coverLetter, onChange }: CoverLetterEditorProps) {
  function updateField<K extends keyof CoverLetter>(key: K, value: CoverLetter[K]) {
    onChange({ ...coverLetter, [key]: value });
  }

  const senderSegments = buildContactSegments(coverLetter.senderContact);

  return (
    <div className="cover-letter-editor">
      <CoverLetterRecipientEditor
        recipient={coverLetter.recipient}
        onChange={(recipient) => updateField('recipient', recipient)}
      />

      <LabeledTextField
        id="cover-letter-salutation"
        label="Salutation"
        value={coverLetter.salutation}
        onChange={(value) => updateField('salutation', value)}
      />

      <CoverLetterBodyParagraphsEditor
        paragraphs={coverLetter.bodyParagraphs}
        onChange={(bodyParagraphs) => updateField('bodyParagraphs', bodyParagraphs)}
      />

      <LabeledTextField
        id="cover-letter-closing"
        label="Closing"
        value={coverLetter.closing}
        onChange={(value) => updateField('closing', value)}
      />

      <div className="cover-letter-editor__sender-contact">
        <span className="cover-letter-editor__sender-contact-label">Signed as:</span>{' '}
        {coverLetter.senderContact.fullName}
        {senderSegments.length > 0 && (
          <span>
            {' '}
            (
            {senderSegments.map((segment) => segment.label).join(' · ')}
            )
          </span>
        )}
        <p className="cover-letter-editor__sender-contact-note">
          Synced automatically from the Resume&rsquo;s contact information.
        </p>
      </div>
    </div>
  );
}
