"use client";

import { useEffect, useState } from "react";
import { useTheme } from "@/lib/theme-context";

// ApexCharts needs resolved color strings (not var(--x) — it isn't always
// applied through a CSS property, so unresolved var() strings silently
// fail in some places like tooltips/labels). Reading getComputedStyle
// after mount and re-reading whenever the theme flips keeps charts in
// sync with dark/light without hardcoding either palette here.
const VAR_NAMES = [
  "--color-brand-500",
  "--color-brand-400",
  "--color-purple-500",
  "--color-warning-500",
  "--color-success-500",
  "--color-error-500",
  "--color-error-400",
  "--color-gray-400",
  "--text-primary",
  "--text-secondary",
  "--text-tertiary",
  "--text-quaternary",
  "--border-secondary",
  "--border-primary",
  "--bg-secondary",
  "--bg-tertiary",
] as const;

type VarName = (typeof VAR_NAMES)[number];

const FALLBACK: Record<VarName, string> = {
  "--color-brand-500": "#339969",
  "--color-brand-400": "#52bd8b",
  "--color-purple-500": "#7a5af8",
  "--color-warning-500": "#f79009",
  "--color-success-500": "#17b26a",
  "--color-error-500": "#f04438",
  "--color-error-400": "#f97066",
  "--color-gray-400": "#94979c",
  "--text-primary": "#f0f1f1",
  "--text-secondary": "#cecfd2",
  "--text-tertiary": "#94979c",
  "--text-quaternary": "#94979c",
  "--border-secondary": "#22262f",
  "--border-primary": "#373a41",
  "--bg-secondary": "#13161b",
  "--bg-tertiary": "#22262f",
};

export function useChartTokens() {
  const { theme } = useTheme();
  const [tokens, setTokens] = useState<Record<VarName, string>>(FALLBACK);

  useEffect(() => {
    // Deferred to a rAF callback (rather than read+setState inline) so we
    // sample computed styles after the [data-theme] attribute's CSS has
    // actually been applied/repainted, not mid-transition.
    const id = requestAnimationFrame(() => {
      const styles = getComputedStyle(document.documentElement);
      const next = { ...FALLBACK };
      for (const name of VAR_NAMES) {
        const value = styles.getPropertyValue(name).trim();
        if (value) next[name] = value;
      }
      setTokens(next);
    });
    return () => cancelAnimationFrame(id);
  }, [theme]);

  return { tokens, apexTheme: (theme === "light" ? "light" : "dark") as "light" | "dark" };
}
