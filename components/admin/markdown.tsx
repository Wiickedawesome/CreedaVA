"use client";

/**
 * Lightweight Markdown renderer for AI chat messages.
 *
 * Supports: headings, bold, italic, inline code, code blocks,
 * unordered/ordered lists, links, horizontal rules, blockquotes,
 * callout boxes (> !tip / > !warning / > !info), tables,
 * highlighted text (==text==), and line breaks.
 *
 * No external dependencies — keeps bundle small.
 */

interface MarkdownProps {
  content: string;
  className?: string;
}

/* SVG icons for callout types */
const CALLOUT_ICONS: Record<string, string> = {
  tip: '<svg class="ai-callout-icon" viewBox="0 0 20 20" fill="none" stroke="#10b981" stroke-width="1.5"><circle cx="10" cy="10" r="8"/><path d="M10 6v4M10 13h.01"/></svg>',
  warning:
    '<svg class="ai-callout-icon" viewBox="0 0 20 20" fill="none" stroke="#f59e0b" stroke-width="1.5"><path d="M10 3L2 17h16L10 3zM10 8v4M10 14h.01"/></svg>',
  info: '<svg class="ai-callout-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="10" cy="10" r="8"/><path d="M10 9v4M10 7h.01"/></svg>',
};

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

  // Tables (| col | col | with separator row | --- | --- |)
  html = html.replace(
    /(?:^|\n)((?:\|.+\|\n?)+)/g,
    (_match, block: string) => {
      const rows = block.trim().split("\n").filter(Boolean);
      if (rows.length < 2) return block;
      // Check for separator row (| --- | --- |)
      const sepIdx = rows.findIndex((r) => /^\|[\s:-]+\|$/.test(r.trim()));
      if (sepIdx < 0) return block;

      const parseRow = (row: string) =>
        row
          .replace(/^\||\|$/g, "")
          .split("|")
          .map((c) => c.trim());

      const headerCells = parseRow(rows[sepIdx - 1] || rows[0]);
      const bodyRows = rows.filter(
        (_, i) => i !== sepIdx && i !== sepIdx - 1,
      );

      let table = '<table class="ai-table"><thead><tr>';
      headerCells.forEach((c) => (table += `<th>${c}</th>`));
      table += "</tr></thead><tbody>";
      bodyRows.forEach((row) => {
        table += "<tr>";
        parseRow(row).forEach((c) => (table += `<td>${c}</td>`));
        table += "</tr>";
      });
      table += "</tbody></table>";
      return `\n${table}\n`;
    },
  );

  // Callout boxes (&gt; !tip / &gt; !warning / &gt; !info followed by text)
  html = html.replace(
    /(?:^|\n)(?:&gt; !)(\w+)\s+([\s\S]*?)(?=\n(?!&gt;)|$)/gm,
    (_match, type: string, text: string) => {
      const t = type.toLowerCase();
      const cls = ["tip", "warning", "info"].includes(t) ? t : "info";
      const icon = CALLOUT_ICONS[cls] || CALLOUT_ICONS.info;
      const cleanText = text.replace(/\n&gt; ?/g, " ").trim();
      return `\n<div class="ai-callout ai-callout-${cls}">${icon}<div>${cleanText}</div></div>\n`;
    },
  );

  // Blockquotes (&gt; text) — after callout parsing
  html = html.replace(
    /(?:^|\n)((?:&gt; .+\n?)+)/g,
    (_match, block: string) => {
      const content = block
        .trim()
        .split("\n")
        .map((line) => line.replace(/^&gt; ?/, ""))
        .join("<br/>");
      return `\n<blockquote class="ai-blockquote"><p>${content}</p></blockquote>\n`;
    },
  );

  // Headings (### / ## / #)
  html = html.replace(/^### (.+)$/gm, '<h4 class="ai-h4">$1</h4>');
  html = html.replace(/^## (.+)$/gm, '<h3 class="ai-h3">$1</h3>');
  html = html.replace(/^# (.+)$/gm, '<h2 class="ai-h2">$1</h2>');

  // Highlighted text (==text==)
  html = html.replace(/==(.+?)==/g, '<span class="ai-highlight">$1</span>');

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
  html = html.replace(
    /\n(?!<\/?(?:ul|ol|li|pre|h[2-4]|hr|blockquote|div|table))/g,
    "<br/>",
  );

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
