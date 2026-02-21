import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";

// ── Mock Firebase auth module ────────────────────────
let authCallback: ((user: unknown) => void) | null = null;
const mockSignInWithGoogle = vi.fn();
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

    // Sign out triggers DELETE to /api/session
    mockFetch.mockClear();
    await act(async () => {
      authCallback?.(null);
    });

    expect(mockFetch).toHaveBeenCalledWith("/api/session", expect.objectContaining({
      method: "DELETE",
    }));
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
