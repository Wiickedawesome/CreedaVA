"use client";

import { Suspense, memo } from "react";
import { AuthProvider } from "@/lib/firebase/auth-context";
import { AdminSidebar, AdminTopbar, ToastProvider, PageSkeleton } from "@/components/admin";

const MemoSidebar = memo(AdminSidebar);

function AdminLayout_Inner({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-gray-10 overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden lg:block w-64 shrink-0 border-r border-border bg-gray-20 h-full overflow-y-auto">
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
        <AdminLayout_Inner>{children}</AdminLayout_Inner>
      </ToastProvider>
    </AuthProvider>
  );
}
