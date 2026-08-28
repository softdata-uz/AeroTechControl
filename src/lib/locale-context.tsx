"use client";

import { createContext, useContext, useLayoutEffect, useState, type ReactNode } from "react";
import { dictionaries, type Locale, type TranslationKey } from "@/lib/i18n/translations";

export type { Locale };

const STORAGE_KEY = "atz-locale";

function readStoredLocale(): Locale {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored === "uz" || stored === "en" || stored === "ru" ? stored : "ru";
  } catch {
    return "ru";
  }
}

function writeStoredLocale(locale: Locale) {
  try {
    window.localStorage.setItem(STORAGE_KEY, locale);
  } catch {
    // localStorage unavailable — locale still applies for this session.
  }
}

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey) => string;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
  // Unlike theme (a CSS attribute a pre-paint <script> can set without
  // touching rendered text), locale controls actual JSX text content, so
  // it can only change through a React re-render. Rendering "ru" first
  // exactly matches the server output (no hydration mismatch), then a
  // *layout* effect corrects to the stored locale synchronously before
  // the browser paints — a passive `useEffect` here would still let one
  // wrong-language frame paint first; `useLayoutEffect` runs before paint,
  // so there is no visible flash on reload.
  const [locale, setLocaleState] = useState<Locale>("ru");

  useLayoutEffect(() => {
    const stored = readStoredLocale();
    document.documentElement.lang = stored;
    if (stored !== "ru") setLocaleState(stored);
  }, []);

  function setLocale(next: Locale) {
    setLocaleState(next);
    document.documentElement.lang = next;
    writeStoredLocale(next);
  }

  const value: LocaleContextValue = {
    locale,
    setLocale,
    t: (key) => dictionaries[locale][key] ?? key,
  };

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used within a LocaleProvider");
  return ctx;
}

/** Shorthand for components that only need translation, not the setter. */
export function useTranslations() {
  return useLocale().t;
}

/** Inlined into <head> so `lang` matches the stored locale before first paint. */
export const LOCALE_INIT_SCRIPT = `(function(){try{var l=localStorage.getItem("${STORAGE_KEY}");if(l==="uz"||l==="en"||l==="ru"){document.documentElement.lang=l;}}catch(e){}})();`;
