import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ── Mock Firebase ────────────────────────────────────
const mockInitAppCheck = vi.fn().mockReturnValue({ name: "app-check-instance" });
const mockReCaptchaEnterpriseProvider = vi.fn();

vi.mock("firebase/app-check", () => ({
  initializeAppCheck: (...args: unknown[]) => mockInitAppCheck(...args),
  ReCaptchaEnterpriseProvider: class {
    constructor(siteKey: string) {
      mockReCaptchaEnterpriseProvider(siteKey);
    }
  },
  getToken: vi.fn(),
}));

vi.mock("@/lib/firebase/config", () => ({
  app: { name: "mock-app" },
}));

// Reset module cache between tests to clear the singleton
const originalEnv = process.env;

beforeEach(() => {
  vi.clearAllMocks();
  vi.resetModules();
  process.env = { ...originalEnv };
  // Default state: missing enablement flag
  delete process.env.NEXT_PUBLIC_RECAPTCHA_ENTERPRISE_SITE_KEY;
  delete process.env.NEXT_PUBLIC_ENABLE_APP_CHECK;
});

afterEach(() => {
  process.env = originalEnv;
});

describe("initializeAppCheck", () => {
  it("returns null when enablement flag is missing", async () => {
    process.env.NEXT_PUBLIC_RECAPTCHA_ENTERPRISE_SITE_KEY = "test-site-key";

    const { initializeAppCheck } = await import("@/lib/firebase/app-check");
    const result = initializeAppCheck();

    expect(result).toBeNull();
    expect(mockInitAppCheck).not.toHaveBeenCalled();
  });

  it("returns null when RECAPTCHA key is not set", async () => {
    // Only set enable flag
    process.env.NEXT_PUBLIC_ENABLE_APP_CHECK = "true";
    
    const { initializeAppCheck } = await import("@/lib/firebase/app-check");
    const result = initializeAppCheck();

    expect(result).toBeNull();
    expect(mockInitAppCheck).not.toHaveBeenCalled();
  });

  it("initializes App Check when key is set and enabled", async () => {
    process.env.NEXT_PUBLIC_ENABLE_APP_CHECK = "true";
    process.env.NEXT_PUBLIC_RECAPTCHA_ENTERPRISE_SITE_KEY = "test-site-key";

    const { initializeAppCheck } = await import("@/lib/firebase/app-check");
    const result = initializeAppCheck();

    expect(result).toEqual({ name: "app-check-instance" });
    expect(mockReCaptchaEnterpriseProvider).toHaveBeenCalledWith("test-site-key");
    expect(mockInitAppCheck).toHaveBeenCalledWith(
      { name: "mock-app" },
      expect.objectContaining({ isTokenAutoRefreshEnabled: true }),
    );
  });

  it("returns cached instance on second call", async () => {
    process.env.NEXT_PUBLIC_ENABLE_APP_CHECK = "true";
    process.env.NEXT_PUBLIC_RECAPTCHA_ENTERPRISE_SITE_KEY = "test-site-key";

    const { initializeAppCheck } = await import("@/lib/firebase/app-check");
    const first = initializeAppCheck();
    const second = initializeAppCheck();

    expect(first).toBe(second);
    expect(mockInitAppCheck).toHaveBeenCalledTimes(1);
  });

  it("enables debug token in development", async () => {
    process.env.NEXT_PUBLIC_ENABLE_APP_CHECK = "true";
    process.env.NEXT_PUBLIC_RECAPTCHA_ENTERPRISE_SITE_KEY = "test-site-key";
    
    // @ts-expect-error - overriding read-only for test
    process.env.NODE_ENV = "development";

    const { initializeAppCheck } = await import("@/lib/firebase/app-check");
    initializeAppCheck();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((globalThis as any).FIREBASE_APPCHECK_DEBUG_TOKEN).toBe(true);
  });
});
