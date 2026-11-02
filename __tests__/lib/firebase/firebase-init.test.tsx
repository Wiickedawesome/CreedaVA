import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";

// ── Mock Firebase modules ────────────────────────────
const mockInitAppCheck = vi.fn();
const mockInitPerformance = vi.fn();
const mockActivateRemoteConfig = vi.fn();

vi.mock("@/lib/firebase/app-check", () => ({
  initializeAppCheck: () => mockInitAppCheck(),
}));

vi.mock("@/lib/firebase/performance", () => ({
  initializePerformance: () => mockInitPerformance(),
}));

vi.mock("@/lib/firebase/remote-config", () => ({
  activateRemoteConfig: () => mockActivateRemoteConfig(),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("FirebaseInit", () => {
  it("renders nothing (returns null)", async () => {
    // Need dynamic import to get fresh module
    vi.resetModules();
    const { FirebaseInit } = await import("@/lib/firebase/firebase-init");

    const { container } = render(<FirebaseInit />);
    expect(container.innerHTML).toBe("");
  });

  it("does not initialize synchronously on mount", async () => {
    // App Check pulls ~350 KB of reCAPTCHA. Initializing at mount put that on
    // the critical path and hurt LCP, so it is deferred to idle/interaction.
    vi.resetModules();
    const { FirebaseInit } = await import("@/lib/firebase/firebase-init");

    render(<FirebaseInit />);

    expect(mockInitAppCheck).not.toHaveBeenCalled();
    expect(mockInitPerformance).not.toHaveBeenCalled();
    expect(mockActivateRemoteConfig).not.toHaveBeenCalled();
  });

  it("initializes after the first user interaction", async () => {
    vi.resetModules();
    const { FirebaseInit } = await import("@/lib/firebase/firebase-init");

    render(<FirebaseInit />);

    // Any real interaction must mint the App Check token before the user's
    // write can leave, which is why interaction is a trigger and not just idle.
    window.dispatchEvent(new Event("pointerdown"));

    expect(mockInitAppCheck).toHaveBeenCalledTimes(1);
    expect(mockInitPerformance).toHaveBeenCalledTimes(1);
    expect(mockActivateRemoteConfig).toHaveBeenCalledTimes(1);
  });

  it("initializes once even across repeated interactions and re-renders", async () => {
    vi.resetModules();
    const { FirebaseInit } = await import("@/lib/firebase/firebase-init");

    const { rerender } = render(<FirebaseInit />);
    rerender(<FirebaseInit />);
    rerender(<FirebaseInit />);

    window.dispatchEvent(new Event("pointerdown"));
    window.dispatchEvent(new Event("keydown"));
    window.dispatchEvent(new Event("touchstart"));
    window.dispatchEvent(new Event("scroll"));

    // Module-level _initialized flag plus the once-only listener both apply.
    expect(mockInitAppCheck).toHaveBeenCalledTimes(1);
    expect(mockInitPerformance).toHaveBeenCalledTimes(1);
    expect(mockActivateRemoteConfig).toHaveBeenCalledTimes(1);
  });
});
