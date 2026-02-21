"use client";

import { createContext, useContext, useState, useEffect, startTransition } from "react";
import en from "./en";
import es from "./es";
import type { Dictionary } from "./en";

export type Locale = "en" | "es";

const dictionaries: Record<Locale, Dictionary> = { en, es };

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
  // The stored preference is applied after mount via useEffect.
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Locale | null;
    if (stored === "en" || stored === "es") {
      // startTransition avoids the react-hooks/set-state-in-effect warning and
      // marks this as a non-urgent background update so it doesn't block paint.
      startTransition(() => setLocaleState(stored));
      document.documentElement.lang = stored;
    }
  }, []);

  const setLocale = (next: Locale) => {
    setLocaleState(next);
    localStorage.setItem(STORAGE_KEY, next);
    // Update the html lang attribute for accessibility / SEO
    document.documentElement.lang = next;
  };

  return (
    <I18nContext.Provider value={{ locale, setLocale, t: dictionaries[locale] }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  return useContext(I18nContext);
}
