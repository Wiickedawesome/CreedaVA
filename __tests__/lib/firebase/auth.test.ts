import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mock Firebase Auth ───────────────────────────────
const mockSignInWithPopup = vi.fn();
const mockSignInWithRedirect = vi.fn();
const mockGetRedirectResult = vi.fn();
const mockFirebaseSignOut = vi.fn();
const mockOnAuthStateChanged = vi.fn();

vi.mock("firebase/auth", () => ({
  signInWithPopup: (...args: unknown[]) => mockSignInWithPopup(...args),
  signInWithRedirect: (...args: unknown[]) => mockSignInWithRedirect(...args),
  getRedirectResult: (...args: unknown[]) => mockGetRedirectResult(...args),
  GoogleAuthProvider: class {
    setCustomParameters = vi.fn();
  },
  signOut: (...args: unknown[]) => mockFirebaseSignOut(...args),
  onAuthStateChanged: (...args: unknown[]) => mockOnAuthStateChanged(...args),
}));

vi.mock("@/lib/firebase/config", () => ({
  app: {},
  auth: { name: "mock-auth" },
}));

beforeEach(() => {
  vi.clearAllMocks();
  vi.resetModules();
});

describe("Auth module", () => {
  describe("signInWithGoogle", () => {
    it("returns user when popup sign-in succeeds", async () => {
      const mockUser = { email: "user@creedava.com", uid: "123" };
      mockSignInWithPopup.mockResolvedValue({ user: mockUser });

      const { signInWithGoogle } = await import("@/lib/firebase/auth");
      const user = await signInWithGoogle();

      expect(user).toBe(mockUser);
      expect(mockSignInWithPopup).toHaveBeenCalled();
      expect(mockSignInWithRedirect).not.toHaveBeenCalled();
    });

    it("falls back to redirect when popup is blocked", async () => {
      mockSignInWithPopup.mockRejectedValue({ code: "auth/popup-blocked" });
      mockSignInWithRedirect.mockResolvedValue(undefined);

      const { signInWithGoogle } = await import("@/lib/firebase/auth");

      const result = await Promise.race([
        signInWithGoogle(),
        new Promise((resolve) => setTimeout(() => resolve("navigating"), 50)),
      ]);

      expect(result).toBe("navigating");
      expect(mockSignInWithPopup).toHaveBeenCalled();
      expect(mockSignInWithRedirect).toHaveBeenCalled();
    });
  });

  describe("checkRedirectResult", () => {
    it("returns user from redirect result", async () => {
      const mockUser = { email: "user@creedava.com", uid: "456" };
      mockGetRedirectResult.mockResolvedValue({ user: mockUser });

      const { checkRedirectResult } = await import("@/lib/firebase/auth");
      const user = await checkRedirectResult();

      expect(user).toBe(mockUser);
    });

    it("returns null when no redirect result", async () => {
      mockGetRedirectResult.mockResolvedValue(null);

      const { checkRedirectResult } = await import("@/lib/firebase/auth");
      const user = await checkRedirectResult();

      expect(user).toBeNull();
    });

    it("returns null on error", async () => {
      mockGetRedirectResult.mockRejectedValue(new Error("Redirect error"));

      const { checkRedirectResult } = await import("@/lib/firebase/auth");
      const user = await checkRedirectResult();

      expect(user).toBeNull();
    });
  });

  describe("signOut", () => {
    it("calls Firebase signOut", async () => {
      mockFirebaseSignOut.mockResolvedValue(undefined);

      const { signOut } = await import("@/lib/firebase/auth");
      await signOut();

      expect(mockFirebaseSignOut).toHaveBeenCalled();
    });
  });

  describe("onAuthStateChanged", () => {
    it("subscribes to auth state changes", async () => {
      const mockUnsubscribe = vi.fn();
      mockOnAuthStateChanged.mockReturnValue(mockUnsubscribe);

      const { onAuthStateChanged } = await import("@/lib/firebase/auth");
      const callback = vi.fn();
      const unsub = onAuthStateChanged(callback);

      expect(unsub).toBe(mockUnsubscribe);
      expect(mockOnAuthStateChanged).toHaveBeenCalledWith(
        { name: "mock-auth" },
        callback,
      );
    });
  });
});
