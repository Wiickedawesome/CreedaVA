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

describe("normalizeLegacyHtml — editorial mode", () => {
  const editorial = (html: string) => normalizeLegacyHtml(html, { mode: "editorial" });

  it("drops the centring that makes a generated body read as a slide", () => {
    expect(editorial('<p style="text-align:center;margin-bottom:24px">x</p>')).toBe(
      '<p style="margin-bottom:24px">x</p>',
    );
  });

  it("collapses card grids into plain blocks", () => {
    const html =
      '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:32px">x</div>';
    expect(editorial(html)).toBe('<div>x</div>');
  });

  it("drops per-block padding and background so the template owns the rhythm", () => {
    const html =
      '<div style="padding:32px;background:#fff;border-radius:16px;text-align:center">x</div>';
    expect(editorial(html)).toBe("<div>x</div>");
  });

  it("keeps sizing and margins, which is how a body asks for a wide image", () => {
    const html = '<img src="/a.png" style="width:100%;max-width:900px;margin:24px 0">';
    expect(editorial(html)).toBe(
      '<img src="/a.png" style="width:100%; max-width:900px; margin:24px 0">',
    );
  });

  it("still strips embedded style blocks", () => {
    expect(editorial("<style>p{color:red}</style><p>x</p>")).toBe("<p>x</p>");
  });

  it("leaves the document mode unchanged for landing pages", () => {
    const html = '<p style="text-align:center">x</p>';
    expect(normalizeLegacyHtml(html)).toBe(html);
    expect(normalizeLegacyHtml(html, { mode: "document" })).toBe(html);
  });
});
