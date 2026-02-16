"use client";

import { useRouter } from "next/navigation";
import { useEffect, Suspense, memo } from "react";
import { AuthProvider, useAuth } from "@/lib/firebase/auth-context";
import { AdminSidebar, AdminTopbar, ToastProvider, PageSkeleton } from "@/components/admin";

const MemoSidebar = memo(AdminSidebar);

const ALLOWED_DOMAIN = "creedava.com";

function isAdminUser(email: string | null | undefined): boolean {
  return !!email && email.endsWith(`@${ALLOWED_DOMAIN}`);
}

function AdminAuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || !isAdminUser(user.email))) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-10">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-gray-60">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || !isAdminUser(user.email)) {
    return null;
  }

  return (
    <div className="flex h-screen bg-gray-10 overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden lg:block w-64 flex-shrink-0 border-r border-border bg-white h-full overflow-y-auto">
        <MemoSidebar />
      </div>

      {/* Main content area */}
      <div className="flex flex-1 flex-col h-full w-full overflow-hidden">
        <AdminTopbar />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 pb-20 sm:pb-6">
          <div className="mx-auto max-w-7xl w-full">
            <Suspense fallback={<PageSkeleton />}>
              {children}
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <ToastProvider>
        <AdminAuthGate>{children}</AdminAuthGate>
      </ToastProvider>
    </AuthProvider>
  );
}
