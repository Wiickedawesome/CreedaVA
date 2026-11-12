import { describe, it, expect } from "vitest";
import {
  latestMetricsByKeyword,
  rankDayKey,
  rankHistoryId,
  type RankHistoryRow,
} from "@/lib/utils/rank-history";

/**
 * The id format is a contract with `functions/src/seo/rank-history.ts`. If these
 * diverge, the admin's Search Console sync and the agent stop upserting the same
 * rows and the collection silently doubles.
 */
describe("rankHistoryId", () => {
  it("matches the agent's day__keyword__page format", () => {
    expect(rankHistoryId("2026-11-12", "virtual assistant", "/services")).toBe(
      "2026-11-12__virtual_assistant__services",
    );
  });

  it("slugs with underscores, not hyphens", () => {
    // The app's `slugify` produces hyphens. Using it here would fork the ids.
    // A bare "/" page slugs to "" and leaves the trailing separator.
    expect(rankHistoryId("2026-11-12", "cost of hiring", "/")).toBe(
      "2026-11-12__cost_of_hiring__",
    );
  });

  it("is stable for the same inputs so a re-sync upserts", () => {
    const a = rankHistoryId("2026-11-12", "real estate va", "/services");
    const b = rankHistoryId("2026-11-12", "Real  Estate VA", "/services");
    expect(a).toBe(b);
  });

  it("stays within Firestore's id length limit", () => {
    const long = "x".repeat(500);
    expect(rankHistoryId("2026-11-12", long, long).length).toBeLessThanOrEqual(380);
  });
});

describe("rankDayKey", () => {
  it("returns a UTC YYYY-MM-DD key", () => {
    expect(rankDayKey(new Date("2026-11-12T23:30:00Z"))).toBe("2026-11-12");
  });
});

const row = (over: Partial<RankHistoryRow>): RankHistoryRow => ({
  id: "r",
  keyword: "keyword",
  page: "/",
  position: 10,
  clicks: 0,
  impressions: 0,
  ctr: 0,
  dayKey: "2026-11-01",
  ...over,
});

describe("latestMetricsByKeyword", () => {
  it("keeps the newest day per keyword", () => {
    const metrics = latestMetricsByKeyword([
      row({ keyword: "va", dayKey: "2026-11-01", position: 20, clicks: 1 }),
      row({ keyword: "va", dayKey: "2026-11-10", position: 8, clicks: 9 }),
    ]);

    expect(metrics.get("va")).toMatchObject({ position: 8, clicks: 9, dayKey: "2026-11-10" });
  });

  it("prefers the better position when pages tie on day", () => {
    const metrics = latestMetricsByKeyword([
      row({ keyword: "va", page: "/blog", dayKey: "2026-11-10", position: 14 }),
      row({ keyword: "va", page: "/services", dayKey: "2026-11-10", position: 3 }),
    ]);

    expect(metrics.get("va")?.position).toBe(3);
  });

  it("matches keywords case-insensitively", () => {
    const metrics = latestMetricsByKeyword([row({ keyword: "Virtual Assistant" })]);
    expect(metrics.get("virtual assistant")).toBeDefined();
  });

  it("returns an empty map for no rows", () => {
    expect(latestMetricsByKeyword([]).size).toBe(0);
  });
});
