/**
 * Privacy notice shown wherever the user is about to provide sensitive
 * information (LLM API key, career/resume content).
 *
 * Text matches specification.md section 18 (Security and Privacy).
 */
export function PrivacyNotice() {
  return (
    <p role="note" className="privacy-notice">
      Your information is processed in this browser session. When you use
      an LLM feature, the relevant information is sent directly from your
      browser to the selected LLM provider. Your OpenRouter API key is
      kept only in memory and is not stored in browser storage, cookies,
      or application servers.
    </p>
  );
}
