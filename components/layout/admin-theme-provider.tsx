"use client";

import { useAdminTheme } from "@/hooks/useAdminTheme";

/**
 * Drop-in replacement for <ForceTheme theme="dark"> in the admin layout.
 * Reads the user's preferred theme from localStorage (default: "auto")
 * and applies the resolved `data-theme` attribute to <html>.
 * Reacts to OS preference changes when set to "auto".
 */
export function AdminThemeProvider() {
  useAdminTheme();
  return null;
}
