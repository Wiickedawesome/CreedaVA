"use client";

import { createContext, useContext, useState, useEffect, useCallback, startTransition } from "react";
import { useRouter } from "next/navigation";
import en from "./en";
import type { Dictionary } from "./en";

export type Locale = "en" | "es";

// Spanish dictionary is lazy-loaded only when needed — keeps ~44KB out of
// the initial bundle so English-only visitors never pay for it.
let cachedEs: Dictionary | null = null;

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Dictionary;
}

const I18nContext = createContext<I18nContextValue>({
  locale: "en",
  setLocale: () => {},
  t: en,
});

const STORAGE_KEY = "creedava-lang";

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  // Always start with "en" so server and first client render match (no hydration mismatch).
  const [locale, setLocaleState] = useState<Locale>("en");
  const [dict, setDict] = useState<Dictionary>(en);

  const applyLocale = useCallback(async (next: Locale) => {
    if (next === "en") {
      setLocaleState("en");
      setDict(en);
    } else {
      // Lazy-load Spanish dictionary
      if (!cachedEs) {
        const mod = await import("./es");
        cachedEs = mod.default;
      }
      setLocaleState("es");
      setDict(cachedEs);
    }
    document.documentElement.lang = next;
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Locale | null;
    if (stored === "es") {
      // Sync the cookie so server components can read it
      document.cookie = `creedava-lang=es;path=/;max-age=31536000;SameSite=Lax`;
      // Load Spanish in the background — English renders immediately first.
      startTransition(() => { applyLocale("es"); });
    } else {
      // Ensure cookie matches (default English)
      document.cookie = `creedava-lang=en;path=/;max-age=31536000;SameSite=Lax`;
    }
  }, [applyLocale]);

  const setLocale = useCallback((next: Locale) => {
    localStorage.setItem(STORAGE_KEY, next);
    document.cookie = `creedava-lang=${next};path=/;max-age=31536000;SameSite=Lax`;
    applyLocale(next);
    // Refresh server components so they re-render with the new locale cookie
    router.refresh();
  }, [applyLocale, router]);

  return (
    <I18nContext.Provider value={{ locale, setLocale, t: dict }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  return useContext(I18nContext);
}
