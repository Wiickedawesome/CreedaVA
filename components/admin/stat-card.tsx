interface StatCardProps {
  label: string;
  value: string | number;
  badge?: string;
  trend?: { value: number; positive: boolean };
  icon?: React.ReactNode;
}

export function StatCard({ label, value, badge, trend, icon }: StatCardProps) {
  return (
    <div className="rounded-lg border border-border bg-white p-4">
      <div className="flex items-center gap-4">
        {icon && (
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            {icon}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-60">{label}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-2xl font-bold text-gray-90 leading-tight">{value}</p>
            {badge && (
              <span className="inline-flex items-center rounded-full bg-gray-20 px-2.5 py-0.5 text-xs text-gray-80">
                {badge}
              </span>
            )}
            {trend && (
              <span
                className={`inline-flex items-center gap-0.5 text-xs font-medium ${
                  trend.positive ? "text-success" : "text-error"
                }`}
              >
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  {trend.positive ? (
                    <polyline points="18 15 12 9 6 15" />
                  ) : (
                    <polyline points="6 9 12 15 18 9" />
                  )}
                </svg>
                {trend.value}%
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
