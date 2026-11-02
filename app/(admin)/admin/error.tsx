"use client";

import { useEffect } from "react";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Admin]", error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[60vh] px-4">
      <div className="w-full max-w-md text-center space-y-6">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-error/10 text-error flex items-center justify-center">
          <svg
            className="w-7 h-7"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
            />
          </svg>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-gray-100 mb-2">
            Something went wrong
          </h2>
          <p className="text-sm text-gray-60">
            An unexpected error occurred in the admin panel. Try again or
            return to the dashboard.
          </p>
        </div>

        {process.env.NODE_ENV === "development" && error.message && (
          <pre className="text-left text-xs bg-gray-10 p-3 rounded-lg overflow-x-auto text-error border border-border">
            {error.message}
          </pre>
        )}

        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="px-5 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary-hover transition-colors"
          >
            Try Again
          </button>
          <a
            href="/admin"
            className="px-5 py-2 text-sm font-medium rounded-md border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
          >
            Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
