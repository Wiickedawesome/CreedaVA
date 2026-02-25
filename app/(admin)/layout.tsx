export const dynamic = "force-dynamic";

import Script from "next/script";

import { AdminThemeProvider } from "@/components/layout/admin-theme-provider";

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
