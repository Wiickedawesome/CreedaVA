"use client";

import { useState } from "react";
import Image from "next/image";
import { useAuth } from "@/lib/firebase/auth-context";
import { AdminSidebar } from "./sidebar";

export function AdminTopbar() {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <>
      {/* Mobile topbar — hidden on desktop (sidebar visible there) */}
      <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-border bg-white px-4 lg:hidden">
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

        <div className="flex items-center gap-1">
          {/* Notifications */}
          <button className="relative rounded-lg p-2 text-gray-60 hover:bg-gray-20 hover:text-gray-90">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 01-3.46 0" />
            </svg>
          </button>

          {/* User avatar */}
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-20">
            {user?.photoURL ? (
              <Image
                src={user.photoURL}
                alt=""
                width={32}
                height={32}
                className="h-8 w-8 rounded-full"
              />
            ) : (
              <svg className="w-4 h-4 text-gray-60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4-4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            )}
          </div>
        </div>
      </header>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="relative z-50 h-full w-64">
            <AdminSidebar />
          </div>
        </div>
      )}
    </>
  );
}
