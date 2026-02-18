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

  it("calls all initialization functions on mount", async () => {
    vi.resetModules();
    const { FirebaseInit } = await import("@/lib/firebase/firebase-init");

    render(<FirebaseInit />);

    expect(mockInitAppCheck).toHaveBeenCalledTimes(1);
    expect(mockInitPerformance).toHaveBeenCalledTimes(1);
    expect(mockActivateRemoteConfig).toHaveBeenCalledTimes(1);
  });

  it("only initializes once even when re-rendered", async () => {
    vi.resetModules();
    const { FirebaseInit } = await import("@/lib/firebase/firebase-init");

    const { rerender } = render(<FirebaseInit />);
    rerender(<FirebaseInit />);
    rerender(<FirebaseInit />);

    // Module-level _initialized flag prevents multiple init calls
    expect(mockInitAppCheck).toHaveBeenCalledTimes(1);
    expect(mockInitPerformance).toHaveBeenCalledTimes(1);
    expect(mockActivateRemoteConfig).toHaveBeenCalledTimes(1);
  });
});
