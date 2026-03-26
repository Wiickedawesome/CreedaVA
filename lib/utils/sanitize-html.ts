/**
 * Browser-native HTML sanitizer using DOMParser + allowlist.
 * No external dependencies — uses the browser's built-in parser
 * to safely strip dangerous elements and attributes.
 */

const ALLOWED_TAGS = new Set([
  "p", "br", "b", "i", "u", "em", "strong", "a", "ul", "ol", "li",
  "h1", "h2", "h3", "h4", "h5", "h6", "blockquote", "pre", "code",
  "span", "div", "hr", "sub", "sup", "mark", "small", "del", "ins",
  "table", "thead", "tbody", "tr", "th", "td", "caption",
  "img", "figure", "figcaption",
]);

const ALLOWED_ATTRS: Record<string, Set<string>> = {
  a: new Set(["href", "title"]),
  img: new Set(["src", "alt", "width", "height"]),
  td: new Set(["colspan", "rowspan"]),
  th: new Set(["colspan", "rowspan"]),
};

const SAFE_URL_PATTERN = /^(?:https?:\/\/|mailto:|\/)/i;

function isUrlSafe(url: string): boolean {
  return SAFE_URL_PATTERN.test(url.trim());
}

function sanitizeNode(node: Node): void {
  if (node.nodeType === Node.TEXT_NODE) return;

  if (node.nodeType !== Node.ELEMENT_NODE) {
    node.parentNode?.removeChild(node);
    return;
  }

  const el = node as Element;
  const tag = el.tagName.toLowerCase();

  if (!ALLOWED_TAGS.has(tag)) {
    // Keep children (text), remove the element itself
    while (el.firstChild) {
      el.parentNode?.insertBefore(el.firstChild, el);
    }
    el.parentNode?.removeChild(el);
    return;
  }

  // Strip disallowed attributes
  const allowedForTag = ALLOWED_ATTRS[tag];
  const attrs = Array.from(el.attributes);
  for (const attr of attrs) {
    const name = attr.name.toLowerCase();
    if (name.startsWith("on") || !allowedForTag?.has(name)) {
      el.removeAttribute(attr.name);
    }
  }

  // Validate URLs
  if (tag === "a") {
    const href = el.getAttribute("href");
    if (href && !isUrlSafe(href)) {
      el.removeAttribute("href");
    }
    el.setAttribute("rel", "noopener noreferrer ugc");
    el.setAttribute("target", "_blank");
  }
  if (tag === "img") {
    const src = el.getAttribute("src");
    if (src && !isUrlSafe(src)) {
      el.removeAttribute("src");
    }
  }

  // Recurse children (iterate backwards since we may modify the list)
  const children = Array.from(el.childNodes);
  for (const child of children) {
    sanitizeNode(child);
  }
}

export function sanitizeHtml(dirty: string): string {
  if (typeof window === "undefined") {
    // SSR fallback: strip all tags
    return dirty.replace(/<[^>]*>/g, "");
  }
  const doc = new DOMParser().parseFromString(dirty, "text/html");
  const body = doc.body;
  const children = Array.from(body.childNodes);
  for (const child of children) {
    sanitizeNode(child);
  }
  return body.innerHTML;
}
