interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  /**
   * Heading level to render. Defaults to `h1` (the page title). Sections that
   * are embedded inside a page which already owns the `h1` must pass `h2` so
   * the document keeps exactly one `h1`.
   */
  as?: "h1" | "h2";
}

export function PageHeader({ title, description, actions, as: Heading = "h1" }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
      <div className="flex-1">
        <Heading className="text-2xl font-bold text-gray-90 lg:text-3xl">{title}</Heading>
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
