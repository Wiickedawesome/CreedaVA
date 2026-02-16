"use client";

/**
 * Skeleton loading components for admin pages.
 * Shows content placeholders instead of a blank spinner.
 */

function Pulse({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-gray-20 ${className}`} />;
}

export function PageSkeleton() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="space-y-2">
        <Pulse className="h-7 w-48" />
        <Pulse className="h-4 w-72" />
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <Pulse className="h-9 w-20 rounded-lg" />
        <Pulse className="h-9 w-20 rounded-lg" />
        <Pulse className="h-9 w-20 rounded-lg" />
      </div>

      {/* Table rows */}
      <div className="rounded-xl border border-border bg-white overflow-hidden">
        {/* Header */}
        <div className="flex gap-4 border-b border-border px-4 py-3">
          <Pulse className="h-4 w-32" />
          <Pulse className="h-4 w-24" />
          <Pulse className="h-4 w-20" />
          <Pulse className="h-4 w-16" />
        </div>
        {/* Rows */}
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 border-b border-border px-4 py-3 last:border-0">
            <Pulse className="h-4 w-40" />
            <Pulse className="h-4 w-28" />
            <Pulse className="h-4 w-20" />
            <Pulse className="h-5 w-16 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <Pulse className="h-7 w-36" />
        <Pulse className="h-4 w-64" />
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-white p-5 space-y-3">
            <Pulse className="h-4 w-24" />
            <Pulse className="h-8 w-16" />
            <Pulse className="h-3 w-20" />
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-white p-6">
          <Pulse className="h-4 w-24 mb-4" />
          <Pulse className="h-32 w-full rounded-lg" />
        </div>
        <div className="rounded-xl border border-border bg-white p-6">
          <Pulse className="h-4 w-28 mb-4" />
          <Pulse className="h-32 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}
