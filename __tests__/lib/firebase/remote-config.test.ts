import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ── Mock Firebase Remote Config ──────────────────────
const mockFetchAndActivate = vi.fn().mockResolvedValue(true);
const mockGetValue = vi.fn();
const mockGetRemoteConfig = vi.fn();

vi.mock("firebase/remote-config", () => ({
  getRemoteConfig: (...args: unknown[]) => mockGetRemoteConfig(...args),
  fetchAndActivate: (...args: unknown[]) => mockFetchAndActivate(...args),
  getValue: (...args: unknown[]) => mockGetValue(...args),
}));

vi.mock("@/lib/firebase/config", () => ({
  app: { name: "mock-app" },
}));

beforeEach(() => {
  vi.clearAllMocks();
  vi.resetModules();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("Remote Config", () => {
  it("activateRemoteConfig fetches and activates", async () => {
    const fakeRC = { settings: {}, defaultConfig: {} };
    mockGetRemoteConfig.mockReturnValue(fakeRC);

    const { activateRemoteConfig } = await import("@/lib/firebase/remote-config");
    const result = await activateRemoteConfig();

    expect(result).toBe(true);
    expect(mockFetchAndActivate).toHaveBeenCalledWith(fakeRC);
  });

  it("activateRemoteConfig returns false on second call", async () => {
    const fakeRC = { settings: {}, defaultConfig: {} };
    mockGetRemoteConfig.mockReturnValue(fakeRC);

    const { activateRemoteConfig } = await import("@/lib/firebase/remote-config");
    await activateRemoteConfig();
    const result = await activateRemoteConfig();

    expect(result).toBe(false);
    expect(mockFetchAndActivate).toHaveBeenCalledTimes(1);
  });

  it("activateRemoteConfig handles fetch errors gracefully", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const fakeRC = { settings: {}, defaultConfig: {} };
    mockGetRemoteConfig.mockReturnValue(fakeRC);
    mockFetchAndActivate.mockRejectedValueOnce(new Error("Network error"));

    const { activateRemoteConfig } = await import("@/lib/firebase/remote-config");
    const result = await activateRemoteConfig();

    expect(result).toBe(false);
    expect(warnSpy).toHaveBeenCalledWith(
      "[Remote Config] Failed to fetch:",
      expect.any(Error),
    );
  });

  it("getConfigString returns string value", async () => {
    const fakeRC = { settings: {}, defaultConfig: {} };
    mockGetRemoteConfig.mockReturnValue(fakeRC);
    mockGetValue.mockReturnValue({ asString: () => "gemini-2.5-flash" });

    const { getConfigString } = await import("@/lib/firebase/remote-config");
    const val = getConfigString("ai_model");

    expect(val).toBe("gemini-2.5-flash");
    expect(mockGetValue).toHaveBeenCalledWith(fakeRC, "ai_model");
  });

  it("getConfigNumber returns number value", async () => {
    const fakeRC = { settings: {}, defaultConfig: {} };
    mockGetRemoteConfig.mockReturnValue(fakeRC);
    mockGetValue.mockReturnValue({ asNumber: () => 4096 });

    const { getConfigNumber } = await import("@/lib/firebase/remote-config");
    const val = getConfigNumber("ai_max_tokens");

    expect(val).toBe(4096);
  });

  it("getConfigBoolean returns boolean value", async () => {
    const fakeRC = { settings: {}, defaultConfig: {} };
    mockGetRemoteConfig.mockReturnValue(fakeRC);
    mockGetValue.mockReturnValue({ asBoolean: () => false });

    const { getConfigBoolean } = await import("@/lib/firebase/remote-config");
    const val = getConfigBoolean("feature_ai_enabled");

    expect(val).toBe(false);
  });

  it("isFeatureEnabled delegates to getConfigBoolean", async () => {
    const fakeRC = { settings: {}, defaultConfig: {} };
    mockGetRemoteConfig.mockReturnValue(fakeRC);
    mockGetValue.mockReturnValue({ asBoolean: () => true });

    const { isFeatureEnabled } = await import("@/lib/firebase/remote-config");
    const enabled = isFeatureEnabled("feature_forum_enabled");

    expect(enabled).toBe(true);
    expect(mockGetValue).toHaveBeenCalledWith(fakeRC, "feature_forum_enabled");
  });

  it("getSupportedLocales splits comma-separated string", async () => {
    const fakeRC = { settings: {}, defaultConfig: {} };
    mockGetRemoteConfig.mockReturnValue(fakeRC);
    mockGetValue.mockReturnValue({ asString: () => "en, es, fr" });

    const { getSupportedLocales } = await import("@/lib/firebase/remote-config");
    const locales = getSupportedLocales();

    expect(locales).toEqual(["en", "es", "fr"]);
  });

  it("getSupportedLocales filters empty entries", async () => {
    const fakeRC = { settings: {}, defaultConfig: {} };
    mockGetRemoteConfig.mockReturnValue(fakeRC);
    mockGetValue.mockReturnValue({ asString: () => "en,,es," });

    const { getSupportedLocales } = await import("@/lib/firebase/remote-config");
    const locales = getSupportedLocales();

    expect(locales).toEqual(["en", "es"]);
  });
});
