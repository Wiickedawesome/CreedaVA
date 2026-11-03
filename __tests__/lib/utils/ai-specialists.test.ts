import { describe, it, expect } from "vitest";
import { getSpecialist, ALL_SPECIALISTS } from "@/lib/utils/ai-specialists";

describe("getSpecialist", () => {
  it("returns ARIA for the root admin path", () => {
    expect(getSpecialist("/admin")).toMatchObject({ codename: "ARIA" });
    expect(getSpecialist("/admin/")).toMatchObject({ codename: "ARIA" });
    expect(getSpecialist("")).toMatchObject({ codename: "ARIA" });
  });

  it("returns ARIA for the bookings page", () => {
    expect(getSpecialist("/admin/bookings")).toMatchObject({ codename: "ARIA" });
    expect(getSpecialist("bookings")).toMatchObject({ codename: "ARIA" });
  });

  it("returns ORACLE for SEO pages", () => {
    expect(getSpecialist("/admin/seo/keywords")).toMatchObject({ codename: "ORACLE" });
    expect(getSpecialist("/admin/analytics")).toMatchObject({ codename: "ORACLE" });
  });

  it("returns NOVA for content pages", () => {
    expect(getSpecialist("/admin/blog")).toMatchObject({ codename: "NOVA" });
    expect(getSpecialist("/admin/forum")).toMatchObject({ codename: "NOVA" });
    expect(getSpecialist("/admin/marketing/landing-pages")).toMatchObject({ codename: "NOVA" });
  });

  it("returns MAVERICK for marketing pages", () => {
    expect(getSpecialist("/admin/marketing/campaigns")).toMatchObject({ codename: "MAVERICK" });
    expect(getSpecialist("/admin/emails")).toMatchObject({ codename: "MAVERICK" });
  });

  it("returns SCOUT for sales/CRM pages", () => {
    expect(getSpecialist("/admin/leads")).toMatchObject({ codename: "SCOUT" });
    expect(getSpecialist("/admin/contacts")).toMatchObject({ codename: "SCOUT" });
    expect(getSpecialist("/admin/customers")).toMatchObject({ codename: "SCOUT" });
  });

  it("returns ATLAS for task/project pages", () => {
    expect(getSpecialist("/admin/tasks")).toMatchObject({ codename: "ATLAS" });
    expect(getSpecialist("/admin/projects")).toMatchObject({ codename: "ATLAS" });
  });

  it("returns GUIDE for settings page", () => {
    expect(getSpecialist("/admin/settings")).toMatchObject({ codename: "GUIDE" });
  });

  it("falls back to ARIA for unknown paths", () => {
    expect(getSpecialist("/admin/unknown-page")).toMatchObject({ codename: "ARIA" });
    expect(getSpecialist("some-random-path")).toMatchObject({ codename: "ARIA" });
  });

  it("lowercases the path segment after prefix removal", () => {
    // The prefix /admin/ is matched case-sensitively, but the segment after is lowercased.
    // Short-form paths without the /admin/ prefix are fully lowercased.
    expect(getSpecialist("LEADS")).toMatchObject({ codename: "SCOUT" });
    expect(getSpecialist("BLOG")).toMatchObject({ codename: "NOVA" });
    expect(getSpecialist("TASKS")).toMatchObject({ codename: "ATLAS" });
  });

  it("normalizes paths with trailing slashes", () => {
    expect(getSpecialist("/admin/tasks/")).toMatchObject({ codename: "ATLAS" });
  });

  it("accepts short-form segments without /admin/ prefix", () => {
    expect(getSpecialist("leads")).toMatchObject({ codename: "SCOUT" });
    expect(getSpecialist("tasks")).toMatchObject({ codename: "ATLAS" });
    expect(getSpecialist("settings")).toMatchObject({ codename: "GUIDE" });
  });
});

describe("ALL_SPECIALISTS", () => {
  it("contains exactly 7 specialists", () => {
    expect(ALL_SPECIALISTS).toHaveLength(7);
  });

  it("contains the expected codenames in order", () => {
    const codenames = ALL_SPECIALISTS.map((s) => s.codename);
    expect(codenames).toEqual(["ARIA", "ORACLE", "NOVA", "MAVERICK", "SCOUT", "ATLAS", "GUIDE"]);
  });

  it("each specialist has required fields", () => {
    for (const specialist of ALL_SPECIALISTS) {
      expect(specialist.codename).toBeTruthy();
      expect(specialist.title).toBeTruthy();
      expect(specialist.tagline).toBeTruthy();
      expect(specialist.color).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(specialist.avatarPath).toBeTruthy();
      expect(specialist.specialistPath).toBeTruthy();
      expect(specialist.promptOptions).toBeTypeOf("object");
    }
  });

  it("all specialists have unique codenames", () => {
    const codenames = ALL_SPECIALISTS.map((s) => s.codename);
    const unique = new Set(codenames);
    expect(unique.size).toBe(codenames.length);
  });

  it("all specialists have unique colors", () => {
    const colors = ALL_SPECIALISTS.map((s) => s.color);
    const unique = new Set(colors);
    expect(unique.size).toBe(colors.length);
  });
});
