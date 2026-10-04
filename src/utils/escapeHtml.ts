/**
 * Escapes text for safe interpolation into raw HTML strings — used by the
 * email templates, which build HTML manually (no JSX auto-escaping) from
 * admin-authored fields like blog titles/excerpts.
 */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
