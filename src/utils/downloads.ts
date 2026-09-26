/**
 * Triggers a browser download of the given text content.
 *
 * Uses an in-memory object URL rather than any server round-trip, per
 * specification.md section 3.5 (Browser APIs). The object URL is
 * revoked immediately after the download is triggered.
 */
export function downloadTextFile(
  filename: string,
  contents: string,
  mimeType = 'application/json',
): void {
  const blob = new Blob([contents], { type: mimeType });
  const url = URL.createObjectURL(blob);

  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  URL.revokeObjectURL(url);
}
