import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";

// ── Mock Firebase auth module ────────────────────────
let authCallback: ((user: unknown) => void) | null = null;
const mockSignInWithGoogle = vi.fn();
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
  signInWithCustomToken: (token: string) => mockSignInWithCustomToken(token),
  signOut: () => mockSignOut(),
  checkRedirectResult: () => Promise.resolve(null),
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
      <button onClick={signIn}>Sign In</button>
      <button onClick={logOut}>Log Out</button>
    </div>
  );
}

describe("AuthProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authCallback = null;
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

  it("signs out when the server refuses the identity, so another account can be tried", async () => {
    // Regression: a 403 (wrong email domain, or unverified address) left the
    // rejected identity persisted by the client SDK. Every page load re-sent
    // that identity, the proxy saw no session cookie, and the person bounced
    // back to /login forever with no way to choose a different account.
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 403,
      json: () => Promise.resolve({ error: "Unauthorized domain" }),
    });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    await act(async () => {
      authCallback?.({
        uid: "rejected-uid",
        email: "someone@gmail.com",
        getIdToken: () => Promise.resolve("test-token"),
      });
      await Promise.resolve();
    });

    expect(mockSignOut).toHaveBeenCalled();
  });

  it("does not sign the user out when the cookie is simply not written yet", async () => {
    // A 401/500 is transient or token-clock related; signing out over it would
    // break sign-in for people who are perfectly entitled to a session.
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: () => Promise.resolve("Session creation failed"),
    });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    await act(async () => {
      authCallback?.({
        uid: "slow-uid",
        email: "user@creedava.com",
        getIdToken: () => Promise.resolve("test-token"),
      });
      await Promise.resolve();
    });

    expect(mockSignOut).not.toHaveBeenCalled();
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
