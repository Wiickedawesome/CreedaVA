/**
 * Unit tests for `syncFindings` — the rule that decides whether a finding is
 * still real.
 *
 * Regression: resolution was scoped to targets derived from the run's *findings*.
 * A page that had become completely clean contributed no finding, so it never
 * counted as inspected and its last finding stayed open forever.
 */

import { beforeEach, describe, expect, test, vi } from "vitest";

interface Written {
  id: string;
  data: Record<string, unknown>;
}

const docs = new Map<string, Record<string, unknown>>();
const writes: Written[] = [];
let commitCount = 0;

function resetStore(seed: Record<string, Record<string, unknown>> = {}) {
  docs.clear();
  writes.length = 0;
  commitCount = 0;
  for (const [id, data] of Object.entries(seed)) docs.set(id, data);
}

vi.mock("../src/admin", () => ({
  db: {
    collection: () => ({
      where: () => ({
        get: async () => ({
          forEach: (fn: (doc: { id: string; data: () => Record<string, unknown> }) => void) => {
            for (const [id, data] of docs) fn({ id, data: () => data });
          },
        }),
      }),
      doc: (id: string) => ({ id }),
    }),
    batch: () => ({
      set: (ref: { id: string }, data: Record<string, unknown>) => {
        writes.push({ id: ref.id, data });
      },
      commit: async () => {
        commitCount++;
        for (const w of writes) docs.set(w.id, { ...(docs.get(w.id) ?? {}), ...w.data });
      },
    }),
  },
}));

const { syncFindings } = await import("../src/seo/findings");

const PAGE = "/contact";

/** An existing, still-open finding for a page that has since been fixed. */
function priorFinding(code: string) {
  return {
    skill: "onpage-audit",
    scope: "page",
    target: PAGE,
    code,
    severity: "medium",
    message: "old",
    status: "open",
    detectedAt: "2026-01-01T00:00:00.000Z",
    lastSeenAt: "2026-01-01T00:00:00.000Z",
  };
}

describe("syncFindings", () => {
  beforeEach(() => resetStore());

  test("resolves the last finding on a target that is now clean", async () => {
    resetStore({ "page__contact__alt_missing": priorFinding("alt-missing") });

    // The page was crawled and produced nothing — the exact case that used to
    // leave the finding open forever.
    const result = await syncFindings("onpage-audit", [], { inspectedTargets: [PAGE] });

    expect(result.resolved).toBe(1);
    expect(docs.get("page__contact__alt_missing")?.status).toBe("resolved");
  });

  test("leaves findings alone for targets that were not inspected", async () => {
    resetStore({ "page__contact__alt_missing": priorFinding("alt-missing") });

    // A paginated run that did not reach this page must not imply it is fixed.
    const result = await syncFindings("onpage-audit", [], { inspectedTargets: ["/services"] });

    expect(result.resolved).toBe(0);
    expect(docs.get("page__contact__alt_missing")?.status).toBe("open");
    expect(commitCount).toBe(0);
  });

  test("does nothing at all when no target was inspected", async () => {
    resetStore({ "page__contact__alt_missing": priorFinding("alt-missing") });

    const result = await syncFindings("onpage-audit", []);

    expect(result).toEqual({ written: 0, resolved: 0 });
    expect(docs.get("page__contact__alt_missing")?.status).toBe("open");
  });

  test("a re-detected finding stays open and is stamped with lastSeenAt", async () => {
    resetStore({ "page__contact__thin_content": priorFinding("thin-content") });

    const result = await syncFindings(
      "onpage-audit",
      [
        {
          skill: "onpage-audit",
          scope: "page",
          target: PAGE,
          code: "thin-content",
          severity: "medium",
          message: "Only 154 words",
        },
      ],
      { inspectedTargets: [PAGE] },
    );

    expect(result.written).toBe(1);
    expect(docs.get("page__contact__thin_content")?.status).toBe("open");
  });

  test("a dismissal survives re-detection", async () => {
    resetStore({
      "page__contact__alt_missing": { ...priorFinding("alt-missing"), status: "ignored" },
    });

    await syncFindings(
      "onpage-audit",
      [
        {
          skill: "onpage-audit",
          scope: "page",
          target: PAGE,
          code: "alt-missing",
          severity: "medium",
          message: "still there",
        },
      ],
      { inspectedTargets: [PAGE] },
    );

    expect(docs.get("page__contact__alt_missing")?.status).toBe("ignored");
  });
});
