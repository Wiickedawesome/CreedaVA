"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";

export type AdminTheme = "dark" | "light" | "auto";

export const ADMIN_THEME_KEY = "creedava-admin-theme";

const DEFAULT_THEME: AdminTheme = "auto";

/** Cycle order used by the sidebar/topbar switcher. */
export const ADMIN_THEME_ORDER: readonly AdminTheme[] = ["auto", "light", "dark"];

export function isAdminTheme(value: string | null): value is AdminTheme {
  return value === "auto" || value === "light" || value === "dark";
}

/** The next theme in the cycle, so a single button can walk all three. */
export function nextAdminTheme(theme: AdminTheme): AdminTheme {
  const index = ADMIN_THEME_ORDER.indexOf(theme);
  return ADMIN_THEME_ORDER[(index + 1) % ADMIN_THEME_ORDER.length];
}

export function adminThemeLabel(theme: AdminTheme): string {
  if (theme === "auto") return "Auto";
  return theme === "dark" ? "Dark" : "Light";
}

function getSystemPreference(): "dark" | "light" {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function resolvedTheme(theme: AdminTheme): "dark" | "light" {
  return theme === "auto" ? getSystemPreference() : theme;
}

/**
 * Writes `data-theme` on <html>. Marketing pages never read it — their layout
 * removes the attribute via ForceTheme — so the value only matters under /admin.
 */
function applyTheme(theme: AdminTheme) {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.theme = resolvedTheme(theme);
}

// A module-level listener set keeps every consumer in sync. Each caller used to
// own its own useState, so flipping the theme from the sidebar did not update
// the Settings page until a remount.
const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function readStoredTheme(): AdminTheme {
  if (typeof window === "undefined") return DEFAULT_THEME;
  const stored = localStorage.getItem(ADMIN_THEME_KEY);
  return isAdminTheme(stored) ? stored : DEFAULT_THEME;
}

function getServerTheme(): AdminTheme {
  return DEFAULT_THEME;
}

function setStoredTheme(theme: AdminTheme) {
  localStorage.setItem(ADMIN_THEME_KEY, theme);
  applyTheme(theme);
  // Copy first: a listener may unsubscribe itself while we iterate.
  for (const listener of [...listeners]) listener();
}

/**
 * Manages the admin panel's dark/light theme preference.
 * - Persists to localStorage under `creedava-admin-theme`
 * - Defaults to "auto" (follows the OS preference)
 * - Reacts to OS preference changes when in "auto" mode
 * - Shared across every caller, so a toggle anywhere updates all of them
 */
export function useAdminTheme(): [AdminTheme, (theme: AdminTheme) => void] {
  const theme = useSyncExternalStore(subscribe, readStoredTheme, getServerTheme);

  useEffect(() => {
    applyTheme(theme);
    if (theme !== "auto") return;

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyTheme("auto");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [theme]);

  const setTheme = useCallback((next: AdminTheme) => {
    setStoredTheme(next);
  }, []);

  return [theme, setTheme];
}
