import { describe, it, expect } from "vitest";
import en from "@/lib/i18n/en";
import es from "@/lib/i18n/es";
import type { Dictionary } from "@/lib/i18n/en";

/**
 * Recursively collect all leaf keys as dot-separated paths.
 * For arrays, checks array length rather than individual elements.
 */
function collectKeys(obj: Record<string, unknown>, prefix = ""): string[] {
  const keys: string[] = [];
  for (const key of Object.keys(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;
    const val = obj[key];
    if (Array.isArray(val)) {
      keys.push(`${path}[]`);
    } else if (val && typeof val === "object") {
      keys.push(...collectKeys(val as Record<string, unknown>, path));
    } else {
      keys.push(path);
    }
  }
  return keys;
}

describe("i18n dictionaries", () => {
  it("en dictionary is not empty", () => {
    expect(Object.keys(en).length).toBeGreaterThan(0);
  });

  it("es dictionary is not empty", () => {
    expect(Object.keys(es).length).toBeGreaterThan(0);
  });

  it("es dictionary satisfies the Dictionary type (same structure as en)", () => {
    // If this compiles, es has the correct structure
    const _dict: Dictionary = es;
    expect(_dict).toBeDefined();
  });

  it("en and es have the same top-level sections", () => {
    const enSections = Object.keys(en).sort();
    const esSections = Object.keys(es).sort();
    expect(esSections).toEqual(enSections);
  });

  it("en and es have the same nested key structure", () => {
    const enKeys = collectKeys(en as unknown as Record<string, unknown>).sort();
    const esKeys = collectKeys(es as unknown as Record<string, unknown>).sort();

    const missingInEs = enKeys.filter((k) => !esKeys.includes(k));
    const extraInEs = esKeys.filter((k) => !enKeys.includes(k));

    expect(missingInEs).toEqual([]);
    expect(extraInEs).toEqual([]);
  });

  it("no en string values are empty", () => {
    function findEmpty(obj: Record<string, unknown>, path = ""): string[] {
      const empty: string[] = [];
      for (const [key, val] of Object.entries(obj)) {
        const p = path ? `${path}.${key}` : key;
        if (typeof val === "string" && val.trim() === "") {
          empty.push(p);
        } else if (val && typeof val === "object" && !Array.isArray(val)) {
          empty.push(...findEmpty(val as Record<string, unknown>, p));
        }
      }
      return empty;
    }
    expect(findEmpty(en as unknown as Record<string, unknown>)).toEqual([]);
  });

  it("no es string values are empty", () => {
    function findEmpty(obj: Record<string, unknown>, path = ""): string[] {
      const empty: string[] = [];
      for (const [key, val] of Object.entries(obj)) {
        const p = path ? `${path}.${key}` : key;
        if (typeof val === "string" && val.trim() === "") {
          empty.push(p);
        } else if (val && typeof val === "object" && !Array.isArray(val)) {
          empty.push(...findEmpty(val as Record<string, unknown>, p));
        }
      }
      return empty;
    }
    expect(findEmpty(es as unknown as Record<string, unknown>)).toEqual([]);
  });

  it("nav section has all required keys", () => {
    const requiredNavKeys = ["home", "services", "pricing", "about", "news", "contact", "signIn", "getStarted"];
    for (const key of requiredNavKeys) {
      expect(en.nav).toHaveProperty(key);
      expect(es.nav).toHaveProperty(key);
    }
  });

  it("forum section has auth-related keys", () => {
    const authKeys = ["signIn", "signUp", "logOut", "email", "password"];
    for (const key of authKeys) {
      expect(en.forum).toHaveProperty(key);
      expect(es.forum).toHaveProperty(key);
    }
  });
});
