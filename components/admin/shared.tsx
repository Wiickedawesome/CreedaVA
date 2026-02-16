interface StatusBadgeProps {
  status: string;
  variant?: "default" | "success" | "warning" | "error" | "info";
}

const variantStyles: Record<string, string> = {
  default: "bg-gray-20 text-gray-80",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  error: "bg-error/10 text-error",
  info: "bg-primary/10 text-primary",
};

export function StatusBadge({ status, variant = "default" }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
        variantStyles[variant] || variantStyles.default
      }`}
    >
      {status}
    </span>
  );
}

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-white p-12 text-center">
      {icon && (
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-20 text-gray-50">
          {icon}
        </div>
      )}
      <h3 className="text-sm font-medium text-gray-90">{title}</h3>
      {description && (
        <p className="mt-1 text-sm text-gray-50">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

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
    <div className={`rounded-lg border border-border bg-white p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold text-gray-90">{title}</h3>
        {action}
      </div>
      {children}
    </div>
  );
}
