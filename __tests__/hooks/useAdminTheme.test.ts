import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  ADMIN_THEME_KEY,
  ADMIN_THEME_ORDER,
  adminThemeLabel,
  isAdminTheme,
  nextAdminTheme,
  type AdminTheme,
} from "@/hooks/useAdminTheme";

describe("admin theme helpers", () => {
  it("cycles auto → light → dark → auto", () => {
    expect(nextAdminTheme("auto")).toBe("light");
    expect(nextAdminTheme("light")).toBe("dark");
    expect(nextAdminTheme("dark")).toBe("auto");
  });

  it("walks the whole cycle without skipping a mode", () => {
    const seen: AdminTheme[] = [];
    let theme: AdminTheme = "auto";
    for (let i = 0; i < ADMIN_THEME_ORDER.length; i++) {
      seen.push(theme);
      theme = nextAdminTheme(theme);
    }
    expect(seen.sort()).toEqual([...ADMIN_THEME_ORDER].sort());
    expect(theme).toBe("auto");
  });

  it("only accepts the three known preferences, so a stale localStorage value cannot break the page", () => {
    expect(isAdminTheme("auto")).toBe(true);
    expect(isAdminTheme("light")).toBe(true);
    expect(isAdminTheme("dark")).toBe(true);
    expect(isAdminTheme("system")).toBe(false);
    expect(isAdminTheme("")).toBe(false);
    expect(isAdminTheme(null)).toBe(false);
  });

  it("labels every mode", () => {
    expect(adminThemeLabel("auto")).toBe("Auto");
    expect(adminThemeLabel("light")).toBe("Light");
    expect(adminThemeLabel("dark")).toBe("Dark");
  });

  it("keeps the localStorage key stable — changing it silently resets everyone's preference", () => {
    expect(ADMIN_THEME_KEY).toBe("creedava-admin-theme");
  });
});

describe("dark mode wiring in globals.css", () => {
  const css = readFileSync(join(process.cwd(), "app", "globals.css"), "utf8");

  it("redefines the dark variant to key off data-theme, not the OS", () => {
    // Without this, every `dark:` utility follows prefers-color-scheme and the
    // in-app toggle appears to do nothing on a machine set to the other mode.
    expect(css).toMatch(/@custom-variant\s+dark\s*\(/);
    expect(css).toContain('[data-theme="dark"]');
  });

  it("declares the status text tokens that replaced the raw palette greys and hues", () => {
    for (const token of [
      "--success-text",
      "--warning-text",
      "--error-text",
      "--info-text",
      "--success-soft",
      "--error-soft",
    ]) {
      expect(css).toContain(token);
    }
  });

  it("gives every chart ramp step a dark override", () => {
    const darkBlock = css.slice(css.indexOf(':root[data-theme="dark"]'));
    for (let i = 1; i <= 8; i++) {
      expect(darkBlock).toContain(`--chart-${i}:`);
    }
  });

  it("keeps the marketing tokens out of the dark block", () => {
    // Marketing pages must not shift when the admin theme changes; ForceTheme
    // removes the attribute there, and the tokens are not remapped here.
    const darkBlock = css.slice(css.indexOf(':root[data-theme="dark"]'));
    expect(darkBlock).not.toContain("--mk-paper:");
    expect(darkBlock).not.toContain("--mk-ink:");
  });
});
