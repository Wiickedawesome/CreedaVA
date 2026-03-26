"use client";

import { createContext, useContext, useState, useEffect, useCallback, startTransition } from "react";
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
      // Load Spanish in the background — English renders immediately first.
      startTransition(() => { applyLocale("es"); });
    }
  }, [applyLocale]);

  const setLocale = useCallback((next: Locale) => {
    localStorage.setItem(STORAGE_KEY, next);
    applyLocale(next);
  }, [applyLocale]);

  return (
    <I18nContext.Provider value={{ locale, setLocale, t: dict }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  return useContext(I18nContext);
}
