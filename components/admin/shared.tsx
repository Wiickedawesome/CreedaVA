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
      {icon && <div className="mb-4 text-gray-40">{icon}</div>}
      <h3 className="text-lg font-semibold text-gray-90">{title}</h3>
      {description && <p className="mt-2 text-sm text-gray-60 max-w-sm">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
