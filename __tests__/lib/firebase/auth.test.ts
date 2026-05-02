import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mock Firebase Auth ───────────────────────────────
const mockSignInWithPopup = vi.fn();
const mockFirebaseSignOut = vi.fn();
const mockOnAuthStateChanged = vi.fn();

vi.mock("firebase/auth", () => ({
  signInWithPopup: (...args: unknown[]) => mockSignInWithPopup(...args),
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
    it("starts popup sign-in and returns the signed-in user", async () => {
      const mockUser = { uid: "user-123" };
      mockSignInWithPopup.mockResolvedValue({ user: mockUser });

      const { signInWithGoogle } = await import("@/lib/firebase/auth");
      const user = await signInWithGoogle();

      expect(mockSignInWithPopup).toHaveBeenCalled();
      expect(user).toBe(mockUser);
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
