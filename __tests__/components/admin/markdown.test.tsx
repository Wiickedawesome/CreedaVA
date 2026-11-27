import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Markdown } from "@/components/admin/markdown";

/**
 * `markdownToHtml` builds HTML by string concatenation and the result is
 * injected with `dangerouslySetInnerHTML`, so escaping and link-scheme
 * handling are security boundaries — not cosmetics.
 */
function renderHtml(content: string): string {
  const { container } = render(<Markdown content={content} />);
  return container.innerHTML;
}

function hrefs(html: string): (string | null)[] {
  const template = document.createElement("template");
  template.innerHTML = html;
  return Array.from(template.content.querySelectorAll("a")).map((a) =>
    a.getAttribute("href"),
  );
}

describe("Markdown", () => {
  it("renders structural markdown", () => {
    const html = renderHtml("# Title\n\n**bold** and *italic*");

    expect(html).toContain("Title");
    expect(html).toContain("<strong>bold</strong>");
    expect(html).toContain("<em>italic</em>");
  });

  it("escapes raw HTML so tags cannot be injected", () => {
    const html = renderHtml('<img src=x onerror="alert(1)"> <script>alert(2)</script>');

    expect(html).not.toContain("<img");
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("keeps http and https links", () => {
    const html = renderHtml("[site](https://creedava.com) [plain](http://example.com)");

    expect(hrefs(html)).toEqual(["https://creedava.com", "http://example.com"]);
  });

  it("keeps site-relative links", () => {
    expect(hrefs(renderHtml("[admin](/admin)"))).toEqual(["/admin"]);
  });

  it("neutralises javascript: and data: link targets", () => {
    const html = renderHtml(
      "[a](javascript:alert(1)) [b](JavaScript:alert(2)) [c](data:text/html,<script>alert(3)</script>)",
    );

    expect(hrefs(html)).toEqual(["#", "#", "#"]);
  });

  it("marks external links as safe targets", () => {
    const html = renderHtml("[site](https://creedava.com)");

    expect(html).toContain('rel="noopener noreferrer"');
    expect(html).toContain('target="_blank"');
  });
});
