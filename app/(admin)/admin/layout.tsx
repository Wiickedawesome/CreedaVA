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
    <div className="flex h-screen bg-gray-10">
      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        <MemoSidebar />
      </div>

      {/* Main content area */}
      <div className="flex flex-1 flex-col lg:ml-64">
        <AdminTopbar />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Suspense fallback={<PageSkeleton />}>
            {children}
          </Suspense>
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
