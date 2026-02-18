"use client";

/**
 * Lightweight Markdown renderer for AI chat messages.
 *
 * Supports: headings, bold, italic, inline code, code blocks,
 * unordered/ordered lists, links, horizontal rules, line breaks.
 *
 * No external dependencies — keeps bundle small.
 */

interface MarkdownProps {
  content: string;
  className?: string;
}

/**
 * Convert a markdown string to sanitized HTML.
 * Only structural markdown is rendered — no raw HTML passthrough.
 */
function markdownToHtml(md: string): string {
  let html = md;

  // Escape HTML to prevent XSS (before we add our own tags)
  html = html
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Code blocks (``` ... ```) — must come before inline transforms
  html = html.replace(
    /```(\w*)\n([\s\S]*?)```/g,
    (_match, _lang, code) =>
      `<pre class="ai-code-block"><code>${code.trimEnd()}</code></pre>`,
  );

  // Inline code (`...`)
  html = html.replace(
    /`([^`\n]+)`/g,
    '<code class="ai-inline-code">$1</code>',
  );

  // Headings (### / ## / #)
  html = html.replace(/^### (.+)$/gm, '<h4 class="ai-h4">$1</h4>');
  html = html.replace(/^## (.+)$/gm, '<h3 class="ai-h3">$1</h3>');
  html = html.replace(/^# (.+)$/gm, '<h2 class="ai-h2">$1</h2>');

  // Bold + italic (***text*** or ___text___)
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>");
  html = html.replace(/___(.+?)___/g, "<strong><em>$1</em></strong>");

  // Bold (**text** or __text__)
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/__(.+?)__/g, "<strong>$1</strong>");

  // Italic (*text* or _text_)
  html = html.replace(/(?<!\*)\*([^*\n]+)\*(?!\*)/g, "<em>$1</em>");
  html = html.replace(/(?<!_)_([^_\n]+)_(?!_)/g, "<em>$1</em>");

  // Links [text](url)
  html = html.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer" class="ai-link">$1</a>',
  );

  // Horizontal rule (---, ***, ___)
  html = html.replace(/^(?:---|\*\*\*|___)\s*$/gm, '<hr class="ai-hr" />');

  // Unordered lists (- item or * item)
  html = html.replace(
    /(?:^|\n)((?:[ ]*[-*] .+\n?)+)/g,
    (_match, block: string) => {
      const items = block
        .trim()
        .split("\n")
        .map((line) => line.replace(/^[ ]*[-*] /, ""))
        .map((item) => `<li>${item}</li>`)
        .join("");
      return `\n<ul class="ai-ul">${items}</ul>\n`;
    },
  );

  // Ordered lists (1. item)
  html = html.replace(
    /(?:^|\n)((?:[ ]*\d+\. .+\n?)+)/g,
    (_match, block: string) => {
      const items = block
        .trim()
        .split("\n")
        .map((line) => line.replace(/^[ ]*\d+\. /, ""))
        .map((item) => `<li>${item}</li>`)
        .join("");
      return `\n<ol class="ai-ol">${items}</ol>\n`;
    },
  );

  // Line breaks (single newlines → <br>, except around block elements)
  html = html.replace(/\n(?!<\/?(?:ul|ol|li|pre|h[2-4]|hr))/g, "<br/>");

  // Clean up double <br/> artifacts
  html = html.replace(/(<br\/>){3,}/g, "<br/><br/>");

  return html.trim();
}

export function Markdown({ content, className = "" }: MarkdownProps) {
  return (
    <div
      className={`ai-markdown ${className}`}
      dangerouslySetInnerHTML={{ __html: markdownToHtml(content) }}
    />
  );
}
