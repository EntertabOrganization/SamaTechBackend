import sanitizeHtml from "sanitize-html";

/**
 * Blog content is authored with a Quill rich-text editor in AramwayDashboard
 * and rendered as raw HTML on the public Aramway site, so it's sanitized on
 * the way in — this is the only point every blog write passes through.
 * Allowlist matches Quill's "snow" toolbar output (headers, inline styles,
 * lists, alignment/indent classes, links, images).
 */
const OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    "p",
    "br",
    "strong",
    "b",
    "em",
    "i",
    "u",
    "s",
    "strike",
    "h1",
    "h2",
    "h3",
    "blockquote",
    "ul",
    "ol",
    "li",
    "a",
    "img",
    "span",
  ],
  allowedAttributes: {
    a: ["href", "target", "rel"],
    img: ["src", "alt"],
    span: ["style", "class"],
    p: ["class", "style"],
    li: ["class", "data-list"],
    ol: ["class"],
    ul: ["class"],
  },
  allowedStyles: {
    "*": {
      color: [/^#[0-9a-fA-F]{3,8}$/, /^rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)$/],
      "background-color": [/^#[0-9a-fA-F]{3,8}$/, /^rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)$/],
      "text-align": [/^(left|right|center|justify)$/],
    },
  },
  allowedSchemes: ["http", "https", "mailto"],
  allowedSchemesByTag: { img: ["http", "https", "data"] },
  transformTags: {
    a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer", target: "_blank" }),
  },
};

export function sanitizeBlogContent(html: string): string {
  return sanitizeHtml(html, OPTIONS);
}
