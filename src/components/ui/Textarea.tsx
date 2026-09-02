import type { TextareaHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: ReactNode;
  required?: boolean;
  hint?: ReactNode;
  error?: string;
  id?: string;
}

/** Multi-line text field matching Input's label/required/error chrome. */
export function Textarea({ label, required, hint, error, id, className, rows = 4, ...rest }: TextareaProps) {
  const destructive = !!error;
  const field = (
    <textarea
      id={id}
      rows={rows}
      aria-invalid={destructive || undefined}
      className={cn(
        "w-full rounded-md border bg-bg-primary px-3 py-2 text-sm text-text-primary shadow-xs",
        "placeholder:text-text-placeholder outline-none transition-colors resize-none",
        destructive
          ? "border-error-400 focus:border-error-500 focus:ring-1 focus:ring-error-500"
          : "border-border-primary hover:border-border-secondary focus:border-brand-500 focus:ring-1 focus:ring-brand-500",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...rest}
    />
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
