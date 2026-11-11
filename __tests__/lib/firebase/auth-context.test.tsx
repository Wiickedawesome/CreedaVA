import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";

// ── Mock Firebase auth module ────────────────────────
let authCallback: ((user: unknown) => void) | null = null;
const mockSignInWithGoogle = vi.fn();
const mockSignInWithGoogleRedirect = vi.fn();
const mockReadRedirectResult = vi.fn();
const mockSignInWithCustomToken = vi.fn();
const mockSignOut = vi.fn();

vi.mock("@/lib/firebase/config", () => ({
  app: {},
  auth: {},
  db: {},
}));

vi.mock("@/lib/firebase/firebase-init", () => ({
  FirebaseInit: () => null,
}));

vi.mock("@/lib/firebase/auth", () => ({
  onAuthStateChanged: (cb: (user: unknown) => void) => {
    authCallback = cb;
    return () => {
      authCallback = null;
    };
  },
  signInWithGoogle: () => mockSignInWithGoogle(),
  signInWithGoogleRedirect: () => mockSignInWithGoogleRedirect(),
  readRedirectResult: () => mockReadRedirectResult(),
  signInWithCustomToken: (token: string) => mockSignInWithCustomToken(token),
  signOut: () => mockSignOut(),
}));

// Mock fetch for session cookie sync
const mockFetch = vi.fn().mockResolvedValue({ ok: true });
vi.stubGlobal("fetch", mockFetch);

import { AuthProvider, useAuth } from "@/lib/firebase/auth-context";

function TestConsumer() {
  const { user, loading, signIn, logOut } = useAuth();
  return (
    <div>
      <span data-testid="loading">{String(loading)}</span>
      <span data-testid="user">{user ? (user as { email: string }).email : "none"}</span>
      {/* Swallow rejections the way the login page does: this fixture is about
          which flow the provider picks, not about how errors are displayed. */}
      <button onClick={() => void signIn().catch(() => {})}>Sign In</button>
      <button onClick={() => void logOut().catch(() => {})}>Log Out</button>
    </div>
  );
}

describe("AuthProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authCallback = null;
    mockReadRedirectResult.mockResolvedValue(null);
  });

  it("starts in loading state", () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );
    expect(screen.getByTestId("loading").textContent).toBe("true");
    expect(screen.getByTestId("user").textContent).toBe("none");
  });

  it("provides user after auth state resolves", async () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    await act(async () => {
      authCallback?.({
        email: "user@creedava.com",
        getIdToken: () => Promise.resolve("mock-token"),
      });
    });

    expect(screen.getByTestId("loading").textContent).toBe("false");
    expect(screen.getByTestId("user").textContent).toBe("user@creedava.com");
  });

  it("sets user to none when signed out", async () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    // First sign in
    await act(async () => {
      authCallback?.({
        email: "user@creedava.com",
        getIdToken: () => Promise.resolve("mock-token"),
      });
    });
    expect(screen.getByTestId("user").textContent).toBe("user@creedava.com");

    // Then sign out
    await act(async () => {
      authCallback?.(null);
    });
    expect(screen.getByTestId("user").textContent).toBe("none");
  });

  it("syncs session cookie on auth state change", async () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    // Sign in triggers POST to /api/session
    await act(async () => {
      authCallback?.({
        uid: "test-uid-123",
        email: "user@creedava.com",
        getIdToken: () => Promise.resolve("test-token"),
      });
    });

    expect(mockFetch).toHaveBeenCalledWith("/api/session", expect.objectContaining({
      method: "POST",
    }));
  });

  it("never deletes the session cookie just because the client lost its user", async () => {
    // Regression: the client SDK reports no user whenever its own persistence
    // is empty (restricted browser storage). Clearing the httpOnly session
    // cookie on that signal destroyed a valid session on every page load and
    // produced an infinite login <-> admin redirect loop.
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    await act(async () => {
      authCallback?.(null);
      await Promise.resolve();
    });

    const usedDelete = mockFetch.mock.calls.some(
      ([, init]) => (init as { method?: string } | undefined)?.method === "DELETE",
    );
    expect(usedDelete).toBe(false);
  });

  it("rebuilds the client session from the server cookie", async () => {
    const restoredUser = { uid: "u1", email: "user@creedava.com" };
    mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ customToken: "ct" }) });
    mockSignInWithCustomToken.mockResolvedValueOnce(restoredUser);

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    await act(async () => {
      authCallback?.(null);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(mockFetch).toHaveBeenCalledWith("/api/session");
    expect(mockSignInWithCustomToken).toHaveBeenCalledWith("ct");
  });

  it("stays anonymous when the server says there is no session", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 401 });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    await act(async () => {
      authCallback?.(null);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(mockSignInWithCustomToken).not.toHaveBeenCalled();
    // loading must resolve, or a guard would wait forever on the skeleton
    expect(screen.getByTestId("loading").textContent).toBe("false");
  });

  it("finishes a redirect sign-in and writes the cookie", async () => {
    // Returning from signInWithGoogleRedirect: the SDK resolves the pending
    // credential, and the cookie must be written before anything asks the
    // server who we are.
    const redirectedUser = {
      uid: "u2",
      email: "user@creedava.com",
      getIdToken: () => Promise.resolve("redirect-token"),
    };
    mockReadRedirectResult.mockResolvedValueOnce({ user: redirectedUser });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    await act(async () => {
      authCallback?.(null);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(screen.getByTestId("user").textContent).toBe("user@creedava.com");
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/session",
      expect.objectContaining({ method: "POST" }),
    );
    // The cookie is authoritative now, so no custom-token round trip is needed.
    expect(mockSignInWithCustomToken).not.toHaveBeenCalled();
  });

  it("falls back to a redirect when the popup cannot run", async () => {
    // Measured in an embedded Chromium: signInWithPopup rejects with
    // auth/internal-error from the Google GIS iframe because third-party
    // storage on the auth domain is denied. Firefox completes the same popup.
    mockSignInWithGoogle.mockRejectedValueOnce({ code: "auth/internal-error" });
    mockSignInWithGoogleRedirect.mockResolvedValue(undefined);

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    await act(async () => {
      authCallback?.(null);
      await Promise.resolve();
    });

    await act(async () => {
      screen.getByText("Sign In").click();
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(mockSignInWithGoogleRedirect).toHaveBeenCalled();
  });

  it("does not redirect when the visitor closed the popup themselves", async () => {
    mockSignInWithGoogle.mockRejectedValueOnce({ code: "auth/popup-closed-by-user" });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    await act(async () => {
      screen.getByText("Sign In").click();
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(mockSignInWithGoogleRedirect).not.toHaveBeenCalled();
  });
});

describe("useAuth", () => {
  it("throws when used outside AuthProvider", () => {
    // Suppress console.error from React error boundary
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => render(<TestConsumer />)).toThrow(
      "useAuth must be used within an AuthProvider",
    );

    spy.mockRestore();
  });
});
