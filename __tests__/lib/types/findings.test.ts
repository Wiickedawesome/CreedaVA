import { describe, it, expect } from "vitest";
import { findingId } from "../../../functions/src/seo/findings";
import { isActionable, openCountByTarget, byUrgency, type Finding } from "@/lib/types/findings";

/**
 * The server writes finding ids via `functions/src/seo/findings.ts` and the app
 * reads them back. The two modules cannot share code (functions deploy from
 * `functions/` alone), so the id contract is pinned here: if the slugging rules
 * diverge, a reseeded finding would appear twice instead of updating.
 */
describe("findingId", () => {
  it("is stable across reruns", () => {
    expect(findingId("page", "/contact", "title-missing")).toBe(
      findingId("page", "/contact", "title-missing"),
    );
  });

  it("slashes and spaces collapse into one segment", () => {
    expect(findingId("page", "/", "title-missing")).toBe("page__root__title_missing");
    expect(findingId("page", "/marketing/landing-pages", "meta-short")).toBe(
      "page__marketing_landing_pages__meta_short",
    );
  });

  it("separates scopes and codes that read the same", () => {
    const page = findingId("page", "/news", "thin-content");
    const keyword = findingId("keyword", "/news", "thin-content");
    expect(page).not.toBe(keyword);
  });

  it("keeps distinct targets distinct", () => {
    expect(findingId("page", "/blog", "h1-missing")).not.toBe(
      findingId("page", "/forum", "h1-missing"),
    );
  });

  it("stays within Firestore's document id limit for long keywords", () => {
    const long = findingId("keyword", "a".repeat(400), "competitor-only");
    expect(long.length).toBeLessThanOrEqual(380);
  });
});

const base: Finding = {
  id: "page__root__title_missing",
  skill: "onpage-audit",
  scope: "page",
  target: "/",
  code: "title-missing",
  severity: "high",
  message: "Missing <title>",
  status: "open",
  detectedAt: "2026-01-01T00:00:00.000Z",
  lastSeenAt: "2026-01-02T00:00:00.000Z",
};

describe("finding helpers", () => {
  it("treats only open findings as actionable", () => {
    expect(isActionable(base)).toBe(true);
    expect(isActionable({ ...base, status: "ignored" })).toBe(false);
    expect(isActionable({ ...base, status: "resolved" })).toBe(false);
  });

  it("counts open findings per target and ignores closed ones", () => {
    const counts = openCountByTarget([
      base,
      { ...base, id: "b", code: "meta-missing" },
      { ...base, id: "c", code: "meta-long", status: "resolved" },
      { ...base, id: "d", target: "/faq", code: "title-short" },
    ]);
    expect(counts.get("/")).toBe(2);
    expect(counts.get("/faq")).toBe(1);
  });

  it("sorts worst first, then most recently seen", () => {
    const sorted = [
      { ...base, id: "low", severity: "low" as const },
      { ...base, id: "high-old", severity: "high" as const, lastSeenAt: "2026-01-01T00:00:00.000Z" },
      { ...base, id: "high-new", severity: "high" as const, lastSeenAt: "2026-02-01T00:00:00.000Z" },
      { ...base, id: "medium", severity: "medium" as const },
    ].sort(byUrgency);
    expect(sorted.map((f) => f.id)).toEqual(["high-new", "high-old", "medium", "low"]);
  });
});
