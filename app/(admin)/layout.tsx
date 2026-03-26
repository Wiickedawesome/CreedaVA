export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import "./admin-styles.css";

import { AdminThemeProvider } from "@/components/layout/admin-theme-provider";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AdminGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Apply min-h-screen to ensure full height background for the admin theme
  return (
    <div className="min-h-screen bg-background text-foreground">
      <AdminThemeProvider />
      {children}
    </div>
  );
}
