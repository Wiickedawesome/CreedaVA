import { describe, expect, it } from "vitest";
import {
  SURVEY_EMAIL_BODY,
  STALE_SURVEY_LOGO_MARKERS,
} from "@/lib/constants/satisfaction-email";
import { EMAIL_LOGO_PNG_BASE64, EMAIL_LOGO_URL } from "@/lib/brand/email-logo";

/**
 * The survey email is only correct if three things line up: an absolute logo
 * URL (a relative `src` resolves against the mail client), an image the URL
 * actually serves, and the placeholders the sender substitutes. Each has broken
 * before, silently — the mail still sends, it just looks wrong.
 */
describe("satisfaction survey email", () => {
  it("uses an absolute logo URL", () => {
    expect(SURVEY_EMAIL_BODY).toContain(`src="${EMAIL_LOGO_URL}"`);
    expect(SURVEY_EMAIL_BODY).not.toMatch(/src="\/(?!\/)/);
  });

  it("keeps the placeholders the mail sender substitutes", () => {
    expect(SURVEY_EMAIL_BODY).toContain("{{CUSTOMER_NAME}}");
    expect(SURVEY_EMAIL_BODY).toContain("{{SURVEY_LINK}}");
  });

  it("serves a PNG the browser can decode", () => {
    const bytes = Buffer.from(EMAIL_LOGO_PNG_BASE64, "base64");

    // PNG magic number — proves the embedded asset was not truncated or
    // HTML-escaped on the way into the source file.
    expect(bytes.subarray(0, 8)).toEqual(
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    );
    // Email clients reject oversized images, and a bloated base64 string makes
    // the module painful to diff.
    expect(bytes.byteLength).toBeLessThan(64 * 1024);
  });

  it("recognises the templates that must be re-seeded", () => {
    // A stored draft carrying any marker is rewritten on the next admin visit.
    for (const marker of STALE_SURVEY_LOGO_MARKERS) {
      expect(SURVEY_EMAIL_BODY).not.toContain(marker);
    }
  });
});
