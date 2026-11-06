import { describe, expect, it } from "vitest";
import en from "@/lib/i18n/en";
import es from "@/lib/i18n/es";

/**
 * The hand-off picker maps over `t.home.handoffTasks` and renders one pill per
 * entry. A locale with fewer entries than the other silently ships a shorter
 * list, and mismatched order means the Spanish pills no longer correspond to
 * the English ones — neither is a type error, so it needs a test.
 */
describe("home.handoffTasks", () => {
  it("has the same number of tasks in both locales", () => {
    expect(es.home.handoffTasks).toHaveLength(en.home.handoffTasks.length);
  });

  it("has no duplicate labels in either locale", () => {
    expect(new Set(en.home.handoffTasks).size).toBe(en.home.handoffTasks.length);
    expect(new Set(es.home.handoffTasks).size).toBe(es.home.handoffTasks.length);
  });

  it("has no empty labels", () => {
    for (const label of [...en.home.handoffTasks, ...es.home.handoffTasks]) {
      expect(label.trim().length).toBeGreaterThan(0);
    }
  });

  it("stays within the pill budget", () => {
    // Measured: 14 pills cost 5 rows / 217px at 1440 and 9 rows / 397px at 375.
    // Ten is the ceiling that keeps the picker under half a phone screen.
    expect(en.home.handoffTasks.length).toBeLessThanOrEqual(10);
    expect(es.home.handoffTasks).toHaveLength(en.home.handoffTasks.length);
  });

  it("keeps labels short enough for a single pill", () => {
    // The pills are `text-[0.82rem]` in a flex-wrap row; a label that wraps
    // inside its own pill looks broken, so cap it near the longest existing one.
    for (const label of [...en.home.handoffTasks, ...es.home.handoffTasks]) {
      expect(label.length).toBeLessThanOrEqual(34);
    }
  });
});
