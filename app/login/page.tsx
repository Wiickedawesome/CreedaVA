"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AuthProvider, useAuth } from "@/lib/firebase/auth-context";
import type { User } from "@/lib/firebase/auth";
import { BrandLogo } from "@/components/brand/brand-logo";

function getSafeRedirectPath(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/admin";
  }

  try {
    const baseUrl = "https://creedava.local";
    const url = new URL(value, baseUrl);
    if (url.origin !== baseUrl || !url.pathname.startsWith("/admin")) {
      return "/admin";
    }
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return "/admin";
  }
}

function LoginComponent() {
  const { user, signIn } = useAuth();
  const searchParams = useSearchParams();
  const redirectTo = getSafeRedirectPath(searchParams.get("from"));
  const [error, setError] = useState<string | null>(null);
  const [signingIn, setSigningIn] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const redirectStartedRef = useRef(false);

  const syncSessionAndRedirect = useCallback(async (firebaseUser: User) => {
    if (redirectStartedRef.current) return;
    redirectStartedRef.current = true;
    setRedirecting(true);

    try {
      const token = await firebaseUser.getIdToken();
      const res = await fetch("/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      if (res.status === 403) {
        setError("Access denied. Only @creedava.com accounts are authorized.");
        setSigningIn(false);
        setRedirecting(false);
        redirectStartedRef.current = false;
        return;
      }

      if (!res.ok) {
        setError("Session creation failed. Please try again.");
        setSigningIn(false);
        setRedirecting(false);
        redirectStartedRef.current = false;
        return;
      }

      window.location.replace(redirectTo);
    } catch (e) {
      console.error("[Auth] Session sync failed:", e);
      setError("Network error during sign-in. Please try again.");
      setSigningIn(false);
      setRedirecting(false);
      redirectStartedRef.current = false;
    }
  }, [redirectTo]);

  // Redirect if user is already signed in or after successful sign-in
  useEffect(() => {
    if (!user) return;

    const timeoutId = window.setTimeout(() => {
      void syncSessionAndRedirect(user);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [user, syncSessionAndRedirect]);

  async function handleSignIn() {
    if (signingIn || redirecting) return;
    setError(null);
    setSigningIn(true);
    try {
      const signedInUser = await signIn();
      await syncSessionAndRedirect(signedInUser);
    } catch (err: unknown) {
      const code = (err as { code?: string }).code;
      const msg = (err as { message?: string }).message;

      // Don't show an error if the user closes the popup
      if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") {
        setSigningIn(false);
        setRedirecting(false);
        return;
      }
      
      setError(msg || "Sign-in failed. Please try again.");
      console.error("[Auth]", code, msg);
      setSigningIn(false);
      setRedirecting(false);
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-mk-paper text-center px-4">
      <div className="max-w-md w-full bg-mk-white p-8 rounded-(--mk-radius-lg) shadow-(--mk-shadow-card) border border-mk-line">
        <div className="flex justify-center mb-6">
          <BrandLogo className="h-20 w-auto" />
        </div>
        <h1 className="font-display text-[clamp(1.8rem,4vw,2.4rem)] font-extrabold leading-[1.08] tracking-[-0.025em] text-mk-ink mb-2">Welcome Back</h1>
        <p className="text-sm text-mk-ink-mute mb-8">
          Sign in to access the CreedaVA dashboard
        </p>

        {signingIn || redirecting ? (
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-mk-brand border-t-transparent mx-auto" />
        ) : (
          <button
            onClick={handleSignIn}
            disabled={signingIn || redirecting}
            className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-mk-brand hover:bg-mk-brand-bright text-white rounded-full shadow-[var(--mk-shadow-brand)] text-sm font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5 bg-mk-white rounded-full p-0.5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Sign in with Google
          </button>
        )}

        {error && (
          <p className="mt-4 text-sm text-red-600">{error}</p>
        )}

        <p className="mt-8 text-xs text-mk-ink-mute">
          Only authorized CreedaVA team members can sign in.
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <AuthProvider>
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center bg-mk-paper-deep">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-mk-brand border-t-transparent" />
          </div>
        }
      >
        <LoginComponent />
      </Suspense>
    </AuthProvider>
  );
}
