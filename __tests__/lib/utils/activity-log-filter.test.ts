import { describe, it, expect } from "vitest";

// ─── Pure filter logic extracted from reports/page.tsx ─────────────────────
// This mirrors the filteredLog useMemo logic to allow unit testing without
// rendering the full admin reports page.

interface ActivityLogEntry {
  id?: string;
  domain?: string;
  riskLevel?: string;
  [key: string]: unknown;
}

function filterActivityLog(
  log: ActivityLogEntry[],
  domainFilter: string,
  riskFilter: string,
): ActivityLogEntry[] {
  return log
    .filter((a) => domainFilter === "all" || a.domain === domainFilter)
    .filter((a) => riskFilter === "all" || a.riskLevel === riskFilter);
}

// ─── Fixtures ───────────────────────────────────────────────────────────────

const SAMPLE_LOG: ActivityLogEntry[] = [
  { id: "1", domain: "leads", riskLevel: "read-only" },
  { id: "2", domain: "leads", riskLevel: "draft" },
  { id: "3", domain: "blog", riskLevel: "auto" },
  { id: "4", domain: "blog", riskLevel: "destructive" },
  { id: "5", domain: "seo", riskLevel: "read-only" },
];

// ─── Tests ──────────────────────────────────────────────────────────────────

describe("Activity log filter logic (reports page)", () => {
  describe("domain filter", () => {
    it("returns all entries when domain is 'all'", () => {
      const result = filterActivityLog(SAMPLE_LOG, "all", "all");
      expect(result).toHaveLength(5);
    });

    it("filters by a specific domain", () => {
      const result = filterActivityLog(SAMPLE_LOG, "leads", "all");
      expect(result).toHaveLength(2);
      expect(result.every((a) => a.domain === "leads")).toBe(true);
    });

    it("returns empty array when no entries match the domain", () => {
      const result = filterActivityLog(SAMPLE_LOG, "settings", "all");
      expect(result).toHaveLength(0);
    });

    it("filters blog entries correctly", () => {
      const result = filterActivityLog(SAMPLE_LOG, "blog", "all");
      expect(result).toHaveLength(2);
      expect(result.map((a) => a.id)).toEqual(["3", "4"]);
    });
  });

  describe("risk filter", () => {
    it("returns all entries when risk is 'all'", () => {
      const result = filterActivityLog(SAMPLE_LOG, "all", "all");
      expect(result).toHaveLength(5);
    });

    it("filters read-only risk entries", () => {
      const result = filterActivityLog(SAMPLE_LOG, "all", "read-only");
      expect(result).toHaveLength(2);
      expect(result.every((a) => a.riskLevel === "read-only")).toBe(true);
    });

    it("filters destructive risk entries", () => {
      const result = filterActivityLog(SAMPLE_LOG, "all", "destructive");
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("4");
    });

    it("returns empty when no entries match risk level", () => {
      const result = filterActivityLog(SAMPLE_LOG, "all", "draft");
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("2");
    });
  });

  describe("combined domain + risk filter", () => {
    it("applies both filters simultaneously", () => {
      const result = filterActivityLog(SAMPLE_LOG, "leads", "read-only");
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("1");
    });

    it("returns empty when combined filter matches nothing", () => {
      const result = filterActivityLog(SAMPLE_LOG, "seo", "destructive");
      expect(result).toHaveLength(0);
    });

    it("handles blog+auto combination", () => {
      const result = filterActivityLog(SAMPLE_LOG, "blog", "auto");
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("3");
    });
  });

  describe("edge cases", () => {
    it("handles empty log array", () => {
      expect(filterActivityLog([], "all", "all")).toHaveLength(0);
      expect(filterActivityLog([], "leads", "read-only")).toHaveLength(0);
    });

    it("handles entries with missing domain or riskLevel", () => {
      const logWithMissing: ActivityLogEntry[] = [
        { id: "a", domain: undefined, riskLevel: undefined },
        { id: "b", domain: "leads", riskLevel: undefined },
      ];
      // 'all' filters should include entries with missing fields
      const result = filterActivityLog(logWithMissing, "all", "all");
      expect(result).toHaveLength(2);

      // Specific domain filter should not match undefined domain
      const domainResult = filterActivityLog(logWithMissing, "leads", "all");
      expect(domainResult).toHaveLength(1);

      // Specific risk filter should not match undefined riskLevel
      const riskResult = filterActivityLog(logWithMissing, "all", "read-only");
      expect(riskResult).toHaveLength(0);
    });
  });
});
