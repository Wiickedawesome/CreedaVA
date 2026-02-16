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
    <section className="py-32 lg:py-48">
      <Container size="sm">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-error/10 text-error flex items-center justify-center">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-100 mb-4">
            Something Went Wrong
          </h1>
          <p className="text-lg text-gray-60 mb-8 max-w-md mx-auto">
            We&apos;re sorry — an unexpected error occurred. Please try again or
            contact us if the problem persists.
          </p>
          {process.env.NODE_ENV === "development" && error.message && (
            <pre className="text-left text-sm bg-gray-10 p-4 rounded-lg mb-8 overflow-x-auto text-error">
              {error.message}
            </pre>
          )}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={reset}
              className="inline-flex items-center justify-center px-8 py-3 bg-primary text-white font-medium rounded-md hover:bg-primary-hover transition-colors"
            >
              Try Again
            </button>
            <Link
              href="/"
              className="inline-flex items-center justify-center px-8 py-3 border-2 border-primary text-primary font-medium rounded-md hover:bg-primary hover:text-white transition-colors"
            >
              Go Home
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}
