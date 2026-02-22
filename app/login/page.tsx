"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { Container, Button } from "@/components/ui";
import { AuthProvider, useAuth } from "@/lib/firebase/auth-context";

function LoginForm() {
  const { user, loading, redirectError, signIn } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  // Combine local sign-in errors with errors returned from the redirect flow
  const displayError = error || redirectError;
  const [signingIn, setSigningIn] = useState(false);

  // Redirect destination set by middleware (defaults to /admin)
  const redirectTo = searchParams.get("from") || "/admin";
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    if (!loading && user && !redirecting) {
      setRedirecting(true);
      // Ensure the session cookie is set BEFORE navigating
      // Otherwise middleware will redirect back to /login (no cookie yet)
      (async () => {
        try {
          const token = await user.getIdToken();
          await fetch("/api/session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token }),
          });
        } catch (e) {
          console.error("[Login] Session cookie sync failed:", e);
        }
        router.replace(redirectTo);
      })();
    }
  }, [user, loading, router, redirectTo, redirecting]);

  async function handleSignIn() {
    if (signingIn) return;
    setError(null);
    setSigningIn(true);
    try {
      await signIn();
    } catch (err: unknown) {
      const code = (err as { code?: string }).code;
      const msg = (err as { message?: string }).message;

      if (code === "auth/unauthorized-domain") {
        setError(
          "This domain is not authorized for sign-in. " +
          "Add it to Firebase Console → Authentication → Settings → Authorized domains.",
        );
      } else if (code === "auth/internal-error" || code === "auth/network-request-failed") {
        setError("Network error. Check your connection and try again.");
      } else if (code === "auth/user-disabled") {
        setError("This account has been disabled.");
      } else {
        setError(
          msg || "Sign-in failed. Make sure you're using a creedava.com account.",
        );
      }
      console.error("[Login]", code, msg, err);
    } finally {
      setSigningIn(false);
    }
  }

  if (loading || redirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-10">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (user) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-10">
      <Container size="sm">
        <div className="max-w-md mx-auto bg-white rounded-2xl shadow-lg border border-border p-8">
          <div className="text-center mb-8">
            <Image
              src="/logo.webp"
              alt="CreedaVA"
              width={160}
              height={46}
              className="h-12 w-auto mx-auto mb-4"
            />
            <h1 className="text-2xl font-bold text-gray-100">
              Welcome Back
            </h1>
            <p className="text-sm text-gray-60 mt-2">
              Sign in to access the CreedaVA dashboard
            </p>
          </div>

          {displayError && (
            <div className="mb-4 rounded-lg bg-error/10 p-3 text-sm text-error">
              {displayError}
            </div>
          )}

          <Button
            fullWidth
            size="lg"
            onClick={handleSignIn}
            disabled={signingIn}
            className="gap-3"
          >
            {signingIn ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
            )}
            Sign in with Google
          </Button>

          <p className="text-center text-xs text-gray-50 mt-6">
            Only authorized CreedaVA team members can sign in.
          </p>
        </div>
      </Container>
    </div>
  );
}

export default function LoginPage() {
  return (
    <AuthProvider>
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center bg-gray-10">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </AuthProvider>
  );
}
