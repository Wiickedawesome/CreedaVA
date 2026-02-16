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
    <div className={`rounded-lg border border-border bg-white p-4 shadow-sm ${className}`}>
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
