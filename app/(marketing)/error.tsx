"use client";

import Link from "next/link";
import { Container } from "@/components/ui";

export default function MarketingError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section className="bg-mk-paper py-32 text-mk-ink lg:py-48">
      <Container size="sm">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-(--mk-radius-lg) bg-error/10 text-error flex items-center justify-center">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
          <h1 className="font-display text-[clamp(1.9rem,3.6vw,3rem)] font-extrabold leading-[1.08] tracking-[-0.025em] text-mk-ink mb-4">
            Something Went Wrong
          </h1>
          <p className="text-lg text-mk-ink-mute mb-8 max-w-md mx-auto">
            We&apos;re sorry — an unexpected error occurred. Please try again or
            contact us if the problem persists.
          </p>
          {process.env.NODE_ENV === "development" && error.message && (
            <pre className="mb-8 overflow-x-auto rounded-(--mk-radius) bg-mk-paper-deep p-4 text-left text-sm text-error">
              {error.message}
            </pre>
          )}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={reset}
              className="inline-flex items-center justify-center px-8 py-3 bg-mk-brand text-white font-semibold rounded-full shadow-[var(--mk-shadow-brand)] hover:bg-mk-brand-bright transition-colors"
            >
              Try Again
            </button>
            <Link
              href="/"
              className="inline-flex items-center justify-center px-8 py-3 border border-mk-line-strong bg-mk-white/80 text-mk-ink font-semibold rounded-full hover:border-mk-brand hover:text-mk-brand transition-colors"
            >
              Go Home
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}
