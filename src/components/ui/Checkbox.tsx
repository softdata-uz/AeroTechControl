"use client";

import type { ReactNode } from "react";
import { Icon } from "@/components/icons";
import { cn } from "@/lib/cn";

interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  indeterminate?: boolean;
  disabled?: boolean;
  label?: ReactNode;
  description?: string;
  className?: string;
}

/** Square control — Figma "Checkbox" component (18666:17792). */
export function Checkbox({
  checked,
  onChange,
  indeterminate = false,
  disabled = false,
  label,
  description,
  className,
}: CheckboxProps) {
  const filled = checked || indeterminate;
  return (
    <label
      className={cn(
        "inline-flex items-start gap-2.5",
        disabled ? "cursor-not-allowed opacity-40" : "cursor-pointer",
        className
      )}
    >
      <span className="relative mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center">
        <input
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
          className="peer absolute inset-0 m-0 cursor-pointer opacity-0 disabled:cursor-not-allowed"
        />
        <span
          aria-hidden
          className={cn(
            "flex h-4 w-4 items-center justify-center rounded-[6px] border transition-colors",
            "peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand-500",
            filled
              ? "border-brand-600 bg-brand-600"
              : "border-border-primary bg-bg-primary peer-hover:border-brand-500"
          )}
        >
          {checked && <Icon name="check" size={11} strokeWidth={2.4} className="text-white" />}
          {!checked && indeterminate && (
            <Icon name="minus" size={11} strokeWidth={2.4} className="text-white" />
          )}
        </span>
      </span>
      {(label || description) && (
        <span className="min-w-0">
          {label && <span className="block text-sm font-medium text-text-primary">{label}</span>}
          {description && <span className="block text-xs text-text-tertiary">{description}</span>}
        </span>
      )}
    </label>
  );
}

interface RadioProps {
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
  label?: ReactNode;
  description?: string;
  name?: string;
  className?: string;
}

/** Circular control — Figma "Radio group item" component (18666:20456). */
export function Radio({ checked, onChange, disabled = false, label, description, name, className }: RadioProps) {
  return (
    <label
      className={cn(
        "inline-flex items-start gap-2.5",
        disabled ? "cursor-not-allowed opacity-40" : "cursor-pointer",
        className
      )}
    >
      <span className="relative mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center">
        <input
          type="radio"
          name={name}
          checked={checked}
          disabled={disabled}
          onChange={() => onChange()}
          className="peer absolute inset-0 m-0 cursor-pointer opacity-0 disabled:cursor-not-allowed"
        />
        <span
          aria-hidden
          className={cn(
            "flex h-4 w-4 items-center justify-center rounded-full border transition-colors",
            "peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand-500",
            checked ? "border-brand-600" : "border-border-primary bg-bg-primary peer-hover:border-brand-500"
          )}
        >
          {checked && <span className="h-1.5 w-1.5 rounded-full bg-brand-600" />}
        </span>
      </span>
      {(label || description) && (
        <span className="min-w-0">
          {label && <span className="block text-sm font-medium text-text-primary">{label}</span>}
          {description && <span className="block text-xs text-text-tertiary">{description}</span>}
        </span>
      )}
    </label>
  );
}
