"use client";

import dynamic from "next/dynamic";

export { AdminSidebar } from "./sidebar";
export { AdminTopbar } from "./topbar";
export { StatCard } from "./stat-card";
export { PageHeader } from "./page-header";
export { AdminTabs } from "./tabs";
export { DataTable } from "./data-table";
export type { Column } from "./data-table";
export { StatusBadge, EmptyState, DashboardSection } from "./shared";
export { Modal } from "./modal";
export { Select } from "./select";
export { ToastProvider, useToast } from "./toast";
export { PageSkeleton, DashboardSkeleton } from "./skeleton";
export { AIPromptButton } from "./ai-prompt";
export type { AIPromptConfig } from "./ai-prompt";
export { Markdown } from "./markdown";
export type { CalendarEvent } from "./calendar-view";

// ─── Lazy-loaded heavy components ────────────────────
// These contain large SVG maps / rich-text editing logic.
// Dynamic import keeps them out of the initial admin bundle.
export const WorldMap = dynamic(() => import("./world-map").then((m) => m.WorldMap), {
  ssr: false,
  loading: () => <div className="h-64 animate-pulse rounded-xl bg-gray-20" />,
});

export const CountryMap = dynamic(() => import("./country-map").then((m) => m.CountryMap), {
  ssr: false,
  loading: () => <div className="h-48 animate-pulse rounded-xl bg-gray-20" />,
});

export const RichTextEditor = dynamic(() => import("./rich-text-editor").then((m) => m.RichTextEditor), {
  ssr: false,
  loading: () => <div className="h-40 animate-pulse rounded-xl bg-gray-20 border border-border" />,
});

export const CalendarView = dynamic(() => import("./calendar-view"), {
  ssr: false,
  loading: () => <div className="h-96 animate-pulse rounded-xl bg-gray-20 border border-border" />,
});

export const ImageGenerator = dynamic(
  () => import("./image-generator").then((m) => m.ImageGenerator),
  { ssr: false },
);
