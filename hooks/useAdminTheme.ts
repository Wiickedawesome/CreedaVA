"use client";

import { useCallback, useEffect, useState } from "react";

export type AdminTheme = "dark" | "light" | "auto";

export const ADMIN_THEME_KEY = "creedava-admin-theme";

function getSystemPreference(): "dark" | "light" {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(theme: AdminTheme) {
  if (typeof document === "undefined") return;
  const resolved = theme === "auto" ? getSystemPreference() : theme;
  document.documentElement.dataset.theme = resolved;
}

/**
 * Manages the admin panel's dark/light theme preference.
 * - Persists to localStorage under `creedava-admin-theme`
 * - Defaults to "auto" (follows the OS preference)
 * - Reacts to OS preference changes when in "auto" mode
 */
export function useAdminTheme(): [AdminTheme, (t: AdminTheme) => void] {
  // Lazy initializer avoids calling setState inside an effect
  const [theme, setThemeState] = useState<AdminTheme>(() => {
    if (typeof window === "undefined") return "auto";
    return (localStorage.getItem(ADMIN_THEME_KEY) as AdminTheme) ?? "auto";
  });

  // Apply theme to DOM whenever it changes
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  // React to OS color-scheme changes when in auto mode
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      if (theme === "auto") applyTheme("auto");
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme]);

  const setTheme = useCallback((newTheme: AdminTheme) => {
    setThemeState(newTheme);
    localStorage.setItem(ADMIN_THEME_KEY, newTheme);
    applyTheme(newTheme);
  }, []);

  return [theme, setTheme];
}
