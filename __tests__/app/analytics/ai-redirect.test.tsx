import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock redirect before importing the component
const mockRedirect = vi.fn();
vi.mock("next/navigation", () => ({
  redirect: (url: string) => mockRedirect(url),
}));

// Import after mock is set up
import AIActivityRedirect from "@/app/(admin)/admin/analytics/ai/page";

describe("AIActivityRedirect", () => {
  beforeEach(() => {
    mockRedirect.mockClear();
  });

  it("redirects to /admin/analytics/reports when rendered", () => {
    try {
      AIActivityRedirect();
    } catch {
      // Next.js redirect() throws a special error — allow it
    }
    expect(mockRedirect).toHaveBeenCalledWith("/admin/analytics/reports");
    expect(mockRedirect).toHaveBeenCalledTimes(1);
  });

  it("does not redirect to any other path", () => {
    try {
      AIActivityRedirect();
    } catch {
      // allowed
    }
    const [target] = mockRedirect.mock.calls[0] ?? [];
    expect(target).toBe("/admin/analytics/reports");
  });
});
