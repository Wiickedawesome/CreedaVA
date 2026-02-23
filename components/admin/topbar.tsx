"use client";

import { useState } from "react";
import Image from "next/image";
import { AdminSidebar } from "./sidebar";

export function AdminTopbar() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleNavigate = () => {
    setSidebarOpen(false);
  };

  return (
    <>
      {/* Mobile topbar — hidden on desktop (sidebar visible there) */}
      <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-border bg-gray-20 px-4 lg:hidden">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-lg p-1.5 text-gray-70 hover:bg-gray-20"
            aria-label="Open menu"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <Image src="/logo.webp" alt="CreedaVA" width={28} height={28} className="h-7 w-7 rounded-lg" />
          <span className="text-base font-bold text-foreground">CreedaVA</span>
        </div>


      </header>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="relative z-50 h-full w-64 bg-card shadow-xl transition-transform duration-300 transform translate-x-0">
             <AdminSidebar onNavigate={handleNavigate} />
          </div>
        </div>
      )}
    </>
  );
}
