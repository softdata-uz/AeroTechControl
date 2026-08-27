import type { InputHTMLAttributes, SelectHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Icon, type IconName } from "@/components/icons";

interface FieldChromeProps {
  label?: ReactNode;
  required?: boolean;
  hint?: ReactNode;
  error?: string;
  id?: string;
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement>, FieldChromeProps {
  icon?: IconName;
}

/**
 * Text input — Figma "Input field" (18666:14342): label + required asterisk
 * above, leading icon, destructive/hint state below. `label`/`hint`/`error`
 * are optional so existing bare filter-bar usages (`<Input icon="search" />`)
 * keep working unchanged; pass them for a full form-field look.
 */
export function Input({ icon, label, required, hint, error, id, className, ...rest }: InputProps) {
  const destructive = !!error;
  const field = (
    <div className="relative">
      {icon && (
        <Icon
          name={icon}
          size={16}
          className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-text-quaternary"
        />
      )}
      <input
        id={id}
        aria-invalid={destructive || undefined}
        className={cn(
          "h-9 w-full rounded-md border bg-bg-primary text-sm text-text-primary shadow-xs",
          "placeholder:text-text-placeholder outline-none transition-colors",
          destructive
            ? "border-error-400 focus:border-error-500 focus:ring-1 focus:ring-error-500"
            : "border-border-primary hover:border-border-secondary focus:border-brand-500 focus:ring-1 focus:ring-brand-500",
          "disabled:cursor-not-allowed disabled:opacity-50",
          icon ? "pl-8 pr-3" : "px-3",
          className
        )}
        {...rest}
      />
    </div>
  );

  if (!label && !hint && !error) return field;

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="flex items-baseline gap-1 text-sm font-medium text-text-secondary">
          {label}
          {required && <span className="text-error-400">*</span>}
        </label>
      )}
      {field}
      {(error || hint) && (
        <p className={cn("text-xs", error ? "text-error-400" : "text-text-tertiary")}>{error || hint}</p>
      )}
    </div>
  );
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement>, FieldChromeProps {
  children: ReactNode;
}

export function Select({ label, required, hint, error, id, className, children, ...rest }: SelectProps) {
  const destructive = !!error;
  const field = (
    <div className="relative">
      <select
        id={id}
        aria-invalid={destructive || undefined}
        className={cn(
          "h-9 w-full appearance-none rounded-md border bg-bg-primary pl-3 pr-8 shadow-xs",
          "text-sm text-text-secondary outline-none transition-colors",
          destructive
            ? "border-error-400 focus:border-error-500 focus:ring-1 focus:ring-error-500"
            : "border-border-primary hover:border-border-secondary focus:border-brand-500 focus:ring-1 focus:ring-brand-500",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        {...rest}
      >
        {children}
      </select>
      <Icon
        name="chevron-down"
        size={16}
        className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-text-quaternary"
      />
    </div>
  );

  if (!label && !hint && !error) return field;

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="flex items-baseline gap-1 text-sm font-medium text-text-secondary">
          {label}
          {required && <span className="text-error-400">*</span>}
        </label>
      )}
      {field}
      {(error || hint) && (
        <p className={cn("text-xs", error ? "text-error-400" : "text-text-tertiary")}>{error || hint}</p>
      )}
    </div>
  );
}
