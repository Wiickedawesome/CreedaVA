import React from "react";

interface DashboardSectionProps {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export function DashboardSection({
  title,
  children,
  action,
  className = "",
}: DashboardSectionProps) {
  return (
    <div className={`rounded-lg border border-border bg-card p-4 shadow-sm ${className}`}>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h3 className="text-base font-bold text-gray-90">{title}</h3>
        {action}
      </div>
      <div className="overflow-x-auto w-full">
        {children}
      </div>
    </div>
  );
}

interface StatusBadgeProps {
  status: string;
  variant?: "default" | "success" | "warning" | "error" | "info";
  className?: string;
}

export function StatusBadge({ status, variant = "default", className = "" }: StatusBadgeProps) {
  const safeVariants = {
    default: "bg-gray-20 text-gray-80 border border-gray-30",
    success: "bg-success/10 text-success border border-success/20",
    warning: "bg-warning/10 text-warning border border-warning/20",
    error: "bg-error/10 text-error border border-error/20",
    info: "bg-info/10 text-info border border-info/20",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${safeVariants[variant] || safeVariants.default} ${className}`}
    >
      {status.replace(/-/g, " ")}
    </span>
  );
}

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}

export function EmptyState({ title, description, action, icon }: EmptyStateProps) {
  return (
     <div className="flex flex-col items-center justify-center py-12 text-center rounded-lg border-2 border-dashed border-gray-20 bg-gray-5/50">
      {icon && <div className="mb-4 text-gray-50">{icon}</div>}
      <h3 className="text-lg font-semibold text-gray-90">{title}</h3>
      {description && <p className="mt-2 text-sm text-gray-60 max-w-sm">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

interface LoadErrorProps {
  message: string;
  /** Optional retry hook — omit for surfaces that cannot re-run the read. */
  onRetry?: () => void;
  className?: string;
}

/**
 * Shown when a collection read FAILED, as opposed to returning nothing.
 *
 * A denied or errored Firestore read leaves the list empty, which used to render
 * as "No … yet" — telling the admin their data does not exist when in fact it
 * could not be fetched. Every list must use this instead of the empty state.
 */
export function LoadError({ message, onRetry, className = "" }: LoadErrorProps) {
  return (
    <div role="alert" className={`rounded-lg border border-error/20 bg-error/10 p-6 text-center ${className}`}>
      <p className="text-sm font-semibold text-error">Could not load this list</p>
      <p className="mx-auto mt-1 max-w-md text-xs text-gray-60 break-words">{message}</p>
      <p className="mx-auto mt-2 max-w-md text-xs text-gray-50">
        The records are not gone — the request to read them failed.
      </p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium text-gray-90 hover:bg-gray-10"
        >
          Retry
        </button>
      )}
    </div>
  );
}
