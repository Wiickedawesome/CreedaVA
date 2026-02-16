interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
      <div className="flex-1">
        <h1 className="text-2xl font-bold text-gray-90 lg:text-3xl">{title}</h1>
        {description && (
          <p className="mt-1 text-sm text-gray-60">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-2 mt-2 sm:mt-0 sm:self-start">
          {actions}
        </div>
      )}
    </div>
  );
}
