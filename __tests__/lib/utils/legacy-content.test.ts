import { describe, expect, it } from "vitest";
import { normalizeLegacyHtml } from "@/lib/utils/legacy-content";

describe("normalizeLegacyHtml", () => {
  it("returns the input untouched when it has no legacy styling", () => {
    const html = "<h2>Title</h2><p>Plain body copy.</p>";
    expect(normalizeLegacyHtml(html)).toBe(html);
  });

  it("returns empty input as-is", () => {
    expect(normalizeLegacyHtml("")).toBe("");
  });

  it("removes a legacy <style> block", () => {
    const html = '<style>@keyframes fadeInUp{to{opacity:1}}</style><p>Body</p>';
    expect(normalizeLegacyHtml(html)).toBe("<p>Body</p>");
  });

  it("removes <script> and <link> blocks", () => {
    const html =
      '<script>alert(1)</script><link rel="stylesheet" href="x.css"><p>Body</p>';
    expect(normalizeLegacyHtml(html)).toBe("<p>Body</p>");
  });

  it("drops colour and typography declarations but keeps layout ones", () => {
    const html =
      '<div style="display:grid;gap:24px;background:#F9FBFF;color:#002D72;font-size:20px;border:1px solid #DDE1E6;padding:32px">x</div>';

    expect(normalizeLegacyHtml(html)).toBe(
      '<div style="display:grid; gap:24px; padding:32px">x</div>',
    );
  });

  it("removes the style attribute entirely when nothing survives", () => {
    const html = '<p style="color:#005148;font-weight:700">x</p>';
    expect(normalizeLegacyHtml(html)).toBe("<p>x</p>");
  });

  it("drops gradient backgrounds and radius, keeping sizes", () => {
    const html =
      '<div style="background:linear-gradient(135deg,#005148,#007A6D);border-radius:24px;padding:64px 32px;text-align:center">x</div>';

    expect(normalizeLegacyHtml(html)).toBe(
      '<div style="padding:64px 32px; text-align:center">x</div>',
    );
  });

  it("handles single-quoted style attributes", () => {
    const html = "<p style='color:#002D72;margin-top:16px'>x</p>";
    expect(normalizeLegacyHtml(html)).toBe("<p style='margin-top:16px'>x</p>");
  });

  it("leaves images with layout-only styles intact", () => {
    const html =
      '<img src="/a.png" alt="" style="width:100%;height:auto;border-radius:16px">';
    expect(normalizeLegacyHtml(html)).toBe(
      '<img src="/a.png" alt="" style="width:100%; height:auto">',
    );
  });

  it("tolerates trailing semicolons and empty declarations", () => {
    const html = '<div style=";display:flex;;color:#fff;">x</div>';
    expect(normalizeLegacyHtml(html)).toBe('<div style="display:flex">x</div>');
  });

  it("does not touch text content that merely mentions a colour", () => {
    const html = "<p>Our brand colour is #005148.</p>";
    expect(normalizeLegacyHtml(html)).toBe(html);
  });
});

describe("normalizeLegacyHtml — landing-page scope", () => {
  it("keeps inline layout, which is how a landing page is composed", () => {
    const html = '<p style="text-align:center;margin-bottom:24px">x</p>';
    expect(normalizeLegacyHtml(html)).toBe('<p style="text-align:center; margin-bottom:24px">x</p>');
  });
});
