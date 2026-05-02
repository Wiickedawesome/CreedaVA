import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ── Mock Firebase Performance ────────────────────────
const mockGetPerformance = vi.fn();
const mockCreateTrace = vi.fn();

vi.mock("firebase/performance", () => ({
  getPerformance: (...args: unknown[]) => mockGetPerformance(...args),
  trace: (...args: unknown[]) => mockCreateTrace(...args),
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

describe("Performance Monitoring", () => {
  it("initializePerformance returns perf instance", async () => {
    const fakePerf = { name: "perf-instance" };
    mockGetPerformance.mockReturnValue(fakePerf);

    const { initializePerformance } = await import("@/lib/firebase/performance");
    const result = initializePerformance();

    expect(result).toBe(fakePerf);
    expect(mockGetPerformance).toHaveBeenCalledWith({ name: "mock-app" });
  });

  it("initializePerformance returns cached instance", async () => {
    const fakePerf = { name: "perf-instance" };
    mockGetPerformance.mockReturnValue(fakePerf);

    const { initializePerformance } = await import("@/lib/firebase/performance");
    initializePerformance();
    const second = initializePerformance();

    expect(second).toBe(fakePerf);
    expect(mockGetPerformance).toHaveBeenCalledTimes(1);
  });

  it("initializePerformance handles errors gracefully", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    mockGetPerformance.mockImplementation(() => {
      throw new Error("Performance not supported");
    });

    const { initializePerformance } = await import("@/lib/firebase/performance");
    const result = initializePerformance();

    expect(result).toBeNull();
    expect(warnSpy).toHaveBeenCalledWith(
      "[Performance] Failed to initialize:",
      expect.any(Error),
    );
  });

  it("startTrace creates and starts a trace", async () => {
    const fakePerf = { name: "perf-instance" };
    const fakeTrace = {
      start: vi.fn(),
      stop: vi.fn(),
      putAttribute: vi.fn(),
    };
    mockGetPerformance.mockReturnValue(fakePerf);
    mockCreateTrace.mockReturnValue(fakeTrace);

    const { initializePerformance, startTrace } = await import("@/lib/firebase/performance");
    initializePerformance();
    const trace = startTrace("test-trace");

    expect(trace).toBe(fakeTrace);
    expect(fakeTrace.start).toHaveBeenCalled();
    expect(mockCreateTrace).toHaveBeenCalledWith(fakePerf, "test-trace");
  });

  it("measureAsync runs function and stops trace on success", async () => {
    const fakePerf = { name: "perf-instance" };
    const fakeTrace = {
      start: vi.fn(),
      stop: vi.fn(),
      putAttribute: vi.fn(),
    };
    mockGetPerformance.mockReturnValue(fakePerf);
    mockCreateTrace.mockReturnValue(fakeTrace);

    const { initializePerformance, measureAsync } = await import("@/lib/firebase/performance");
    initializePerformance();

    const result = await measureAsync("test-op", async () => "result-value", { type: "test" });

    expect(result).toBe("result-value");
    expect(fakeTrace.putAttribute).toHaveBeenCalledWith("type", "test");
    expect(fakeTrace.putAttribute).toHaveBeenCalledWith("status", "success");
    expect(fakeTrace.stop).toHaveBeenCalled();
  });

  it("measureAsync records error and rethrows on failure", async () => {
    const fakePerf = { name: "perf-instance" };
    const fakeTrace = {
      start: vi.fn(),
      stop: vi.fn(),
      putAttribute: vi.fn(),
    };
    mockGetPerformance.mockReturnValue(fakePerf);
    mockCreateTrace.mockReturnValue(fakeTrace);

    const { initializePerformance, measureAsync } = await import("@/lib/firebase/performance");
    initializePerformance();

    const error = new Error("Operation failed");
    await expect(
      measureAsync("test-op", async () => {
        throw error;
      }),
    ).rejects.toThrow("Operation failed");

    expect(fakeTrace.putAttribute).toHaveBeenCalledWith("status", "error");
    expect(fakeTrace.stop).toHaveBeenCalled();
  });
});
