"use client";

import { useEffect, useState } from "react";
import { useTheme } from "@/lib/theme-context";

// Recharts renders plain SVG, so most of the time a `var(--x)` string works
// fine as a `fill`/`stroke` value directly in the DOM. But a few call sites
// (Tooltip `contentStyle`, the donut center-label overlay, values read once
// into JS for math like the legend percentage) need a *resolved* string —
// unresolved var() text passed into non-CSS contexts renders as literal
// text or fails silently. Reading getComputedStyle after mount and
// re-reading whenever the theme flips keeps those cases in sync with
// dark/light without hardcoding either palette here.
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

const VAR_REF = /^var\((--[a-zA-Z0-9-]+)\)$/;

export function useChartTokens() {
  const { theme } = useTheme();
  const [tokens, setTokens] = useState<Record<VarName, string>>(FALLBACK);
  // Snapshot of *any* custom property read on demand via `resolveColor`,
  // for colors that arrive as `var(--x)` strings from callers (status
  // colors, per-series overrides) rather than from the fixed VAR_NAMES set.
  const [resolved, setResolved] = useState<Map<string, string>>(new Map());

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
      setResolved(new Map());
    });
    return () => cancelAnimationFrame(id);
  }, [theme]);

  /** Resolves a `var(--x)` string (or passes through anything else, e.g. an
   * already-resolved hex/rgb string) to a value SVG fill/stroke/tooltip
   * styles can render. Falls back to the input unchanged if the browser
   * can't resolve it (SSR, or a var name outside our design tokens). */
  function resolveColor(color: string | undefined): string | undefined {
    if (!color) return color;
    const match = VAR_REF.exec(color.trim());
    if (!match) return color;
    const varName = match[1];
    if (varName in tokens) return tokens[varName as VarName];
    const cached = resolved.get(varName);
    if (cached) return cached;
    if (typeof document === "undefined") return color;
    const value = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
    if (value) {
      // Cache outside render to avoid a setState-during-render loop; the
      // next paint's effect (or hover) will pick up the cached value.
      resolved.set(varName, value);
      return value;
    }
    return color;
  }

  return { tokens, resolveColor, theme: (theme === "light" ? "light" : "dark") as "light" | "dark" };
}
