"use client";

import {
  adminThemeLabel,
  nextAdminTheme,
  useAdminTheme,
  type AdminTheme,
} from "@/hooks/useAdminTheme";

const ICONS: Record<AdminTheme, React.ReactNode> = {
  auto: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <path d="M8 21h8M12 17v4" />
    </svg>
  ),
  light: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  ),
  dark: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  ),
};

/**
 * One-button theme switcher for the admin chrome.
 *
 * Cycles Auto → Light → Dark. The three-way segmented control in
 * /admin/settings stays the authoritative place to pick a mode; this exists so
 * the mode can be changed without leaving whatever page you are on, which is
 * how the rest of the panel's chrome behaves.
 */
export function AdminThemeToggle({ className = "" }: { className?: string }) {
  const [theme, setTheme] = useAdminTheme();
  const current = adminThemeLabel(theme);
  const upcoming = adminThemeLabel(nextAdminTheme(theme));

  return (
    <button
      type="button"
      onClick={() => setTheme(nextAdminTheme(theme))}
      className={`rounded-lg p-1.5 text-gray-50 hover:bg-gray-30 hover:text-gray-90 transition-colors ${className}`}
      aria-label={`Admin theme: ${current}. Switch to ${upcoming}.`}
      title={`Theme: ${current} — click for ${upcoming}`}
    >
      {ICONS[theme]}
    </button>
  );
}
