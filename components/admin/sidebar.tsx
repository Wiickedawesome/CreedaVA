"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/firebase/auth-context";
import { AdminThemeToggle } from "./theme-toggle";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: number;
  exact?: boolean;
  children?: { label: string; href: string }[];
}

const crmItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/admin",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    label: "Leads",
    href: "/admin/leads",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4-4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 00-3-3.87" />
        <path d="M16 3.13a4 4 0 010 7.75" />
      </svg>
    ),
  },
  {
    label: "Contacts",
    href: "/admin/contacts",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4-4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
  {
    label: "Customers",
    href: "/admin/customers",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
        <path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" />
      </svg>
    ),
  },
  {
    label: "Bookings",
    href: "/admin/bookings",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
  },
];

const contentItems: NavItem[] = [
  {
    label: "Blog",
    href: "/admin/blog",
    // Exact, so the sibling Image studio route does not highlight both.
    exact: true,
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
      </svg>
    ),
  },
  {
    label: "Image studio",
    href: "/admin/studio",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <polyline points="21 15 16 10 5 21" />
      </svg>
    ),
  },
  {
    label: "Forum",
    href: "/admin/forum",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
      </svg>
    ),
  },
];

const marketingItems: NavItem[] = [
  {
    label: "Landing Pages",
    href: "/admin/marketing/landing-pages",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
        <line x1="8" y1="21" x2="16" y2="21" />
        <line x1="12" y1="17" x2="12" y2="21" />
      </svg>
    ),
  },
  {
    label: "Campaigns",
    href: "/admin/marketing/campaigns",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    ),
  },
  {
    label: "Emails",
    href: "/admin/emails",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
        <polyline points="22,6 12,13 2,6" />
      </svg>
    ),
  },
];

const analyticsItems: NavItem[] = [
  {
    label: "Analytics",
    href: "/admin/analytics",
    exact: true,
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
  },
  {
    label: "SEO Hub",
    href: "/admin/seo",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    ),
  },
  {
    label: "Page Metadata",
    href: "/admin/metadata",
    exact: true,
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 4h16v16H4z" />
        <line x1="8" y1="9" x2="16" y2="9" />
        <line x1="8" y1="13" x2="16" y2="13" />
        <line x1="8" y1="17" x2="12" y2="17" />
      </svg>
    ),
  },
];

function NavSection({ title, items, onNavigate }: { title?: string; items: NavItem[]; onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <div className="mb-2">
      {title && (
        <p className="px-3 py-2 text-xs font-medium uppercase tracking-wider text-gray-50">
          {title}
        </p>
      )}
      <nav className="flex flex-col gap-0.5">
        {items.map((item) => {
          const isActive =
            item.href === "/admin" || item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-gray-70 hover:bg-gray-20 hover:text-gray-90"
              }`}
            >
              {item.icon}
              <span className="flex-1">{item.label}</span>
              {item.badge !== undefined && item.badge > 0 && (
                <span className="inline-flex items-center justify-center rounded-full bg-gray-70 px-1.5 py-0.5 text-xs text-white">
                  {item.badge > 99 ? "99+" : item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export function AdminSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { user, logOut } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filterItems = (items: NavItem[], query: string): NavItem[] => {
    if (!query.trim()) return items;
    const q = query.trim().toLowerCase();
    return items.filter((item) => item.label.toLowerCase().includes(q));
  };

  const filteredNav = useMemo(() => {
    const query = searchQuery;
    return {
      crm: filterItems(crmItems, query),
      analytics: filterItems(analyticsItems, query),
      content: filterItems(contentItems, query),
      marketing: filterItems(marketingItems, query),
    };
  }, [searchQuery]);

  const allFilteredItems = useMemo(
    () => [
      ...filteredNav.crm,
      ...filteredNav.analytics,
      ...filteredNav.content,
      ...filteredNav.marketing,
    ],
    [filteredNav],
  );

  return (
    <aside
      className={`fixed left-0 top-0 z-30 flex h-full flex-col border-r border-border bg-gray-20 transition-all duration-200 ${
        collapsed ? "w-16" : "w-full lg:w-64"
      }`}
    >
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-border px-4 shrink-0">
        <Image src="/creedava-mark.svg" alt="" width={28} height={32} className="h-8 w-auto" unoptimized />
        {!collapsed && (
          <span className="text-lg font-bold text-foreground">CreedaVA</span>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto rounded-lg p-1.5 text-gray-50 hover:bg-gray-20 hover:text-gray-80 hidden lg:block"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {collapsed ? (
              <polyline points="9 18 15 12 9 6" />
            ) : (
              <polyline points="15 18 9 12 15 6" />
            )}
          </svg>
        </button>
      </div>

      {/* Search */}
      {!collapsed && (
        <div className="p-3 shrink-0">
          <div className="flex items-center gap-2 rounded-lg border border-border bg-gray-10 px-3 py-2">
            <svg className="w-4 h-4 text-gray-50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search navigation"
              className="w-full bg-transparent text-sm text-foreground placeholder:text-gray-50 outline-none"
            />
          </div>
        </div>
      )}

      {/* Nav */}
      <div className="flex-1 overflow-y-auto px-2 py-2">
        {collapsed ? (
          <nav className="flex flex-col items-center gap-1">
            {allFilteredItems.map(
              (item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  className="rounded-lg p-2.5 text-gray-70 hover:bg-gray-20 hover:text-gray-90"
                  title={item.label}
                  aria-label={item.label}
                >
                  {item.icon}
                </Link>
              )
            )}
          </nav>
        ) : (
          <>
            <NavSection items={filteredNav.crm} onNavigate={onNavigate} />
            <NavSection title="Analytics" items={filteredNav.analytics} onNavigate={onNavigate} />
            <NavSection title="Content" items={filteredNav.content} onNavigate={onNavigate} />
            <NavSection title="Marketing" items={filteredNav.marketing} onNavigate={onNavigate} />
            {allFilteredItems.length === 0 && searchQuery.trim() && (
              <p className="px-3 py-2 text-xs text-gray-50">No matching navigation items</p>
            )}
          </>
        )}
      </div>

      {/* Collapsed rail has no footer, so the switcher lives here instead. */}
      {collapsed && (
        <div className="border-t border-border px-2 py-2 shrink-0 flex justify-center">
          <AdminThemeToggle />
        </div>
      )}

      {/* User + Settings footer */}
      {!collapsed && (
        <div className="border-t border-border p-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-20 shrink-0">
              {user?.photoURL ? (
                <Image
                  src={user.photoURL}
                  alt=""
                  width={36}
                  height={36}
                  className="h-9 w-9 rounded-full"
                />
              ) : (
                <svg className="w-4 h-4 text-gray-60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4-4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-90 truncate">
                {user?.displayName || "Admin"}
              </p>
              <p className="text-xs text-gray-50 truncate">
                {user?.email || ""}
              </p>
            </div>
            <AdminThemeToggle />
            <button
              onClick={logOut}
              className="rounded-lg p-1.5 text-gray-50 hover:bg-gray-20 hover:text-error"
              title="Sign out"
              aria-label="Sign out"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </div>
          <Link
            href="/admin/settings"
            onClick={onNavigate}
            className="mt-2 flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-60 hover:bg-gray-20 hover:text-gray-90 transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
            </svg>
            Settings
          </Link>
        </div>
      )}
    </aside>
  );
}
