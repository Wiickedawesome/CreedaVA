export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import "./admin-styles.css";

import { AdminThemeProvider } from "@/components/layout/admin-theme-provider";
import { getAdminUidFromSession } from "@/lib/firebase/admin-session";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function AdminGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // `proxy.ts` can only check that a session cookie is PRESENT — it runs on
  // the Edge runtime where the Admin SDK's dependencies are unavailable. A
  // forged value therefore used to reach this layout and receive the whole
  // admin shell (measured 2026-11-27: `__session=not-a-real-session` returned
  // 200 with 21,605 bytes of HTML).
  //
  // Data was never exposed — Firestore rules and every API route re-verify — but
  // the outer fence must validate the credential, not merely its existence.
  // Verifying here keeps the SDK on the Node runtime. `verifySessionCookie`
  // with revocation checking is the same call `/api/session` already performs
  // successfully in production, so this adds no new failure mode.
  const uid = await getAdminUidFromSession();
  if (!uid) {
    redirect("/login?from=%2Fadmin");
  }

  // Apply min-h-screen to ensure full height background for the admin theme
  return (
    <div className="min-h-screen bg-background text-foreground">
      <AdminThemeProvider />
      {children}
    </div>
  );
}
