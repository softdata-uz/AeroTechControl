import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

interface ChartFrameProps {
  loading?: boolean;
  isEmpty?: boolean;
  emptyLabel?: string;
  height?: number | string;
  className?: string;
  children: ReactNode;
}

/**
 * Shared loading-skeleton / empty-state wrapper for chart cards — callers
 * decide loading/empty (same as the chart primitives already do), this
 * just gives every chart the same skeleton and empty-message look instead
 * of each page hand-rolling its own.
 */
export function ChartFrame({ loading, isEmpty, emptyLabel = "Нет данных", height = 220, className, children }: ChartFrameProps) {
  if (loading) {
    return <div className={cn("w-full animate-pulse rounded-lg bg-bg-tertiary", className)} style={{ height }} />;
  }
  if (isEmpty) {
    return (
      <div
        className={cn("flex w-full items-center justify-center rounded-lg text-sm text-text-tertiary", className)}
        style={{ height }}
      >
        {emptyLabel}
      </div>
    );
  }
  return <>{children}</>;
}
