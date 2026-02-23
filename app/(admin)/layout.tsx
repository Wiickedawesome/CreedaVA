export const dynamic = "force-dynamic";

import Script from "next/script";

import { ForceTheme } from "@/components/layout/force-theme";

export default function AdminGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Apply min-h-screen to ensure full height background for the darker theme
  return (
    <div className="min-h-screen bg-background text-foreground">
      <ForceTheme theme="dark" />
      {children}
    </div>
  );
}
