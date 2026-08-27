import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Icon, type IconName } from "@/components/icons";

type Hierarchy = "primary" | "secondary" | "tertiary" | "destructive" | "link-color" | "link-gray";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  hierarchy?: Hierarchy;
  size?: Size;
  icon?: IconName;
  iconPosition?: "left" | "right";
  iconOnly?: boolean;
  children?: ReactNode;
}

const base =
  "inline-flex items-center justify-center gap-1.5 font-medium transition-colors " +
  "disabled:opacity-40 disabled:pointer-events-none focus-visible:outline-2 " +
  "focus-visible:outline-offset-2 focus-visible:outline-brand-500 whitespace-nowrap";

const sizeStyles: Record<Size, string> = {
  sm: "h-8 px-3 text-xs rounded-md",
  md: "h-9 px-3.5 text-sm rounded-md",
  lg: "h-10 px-4 text-sm rounded-lg",
};

const iconOnlySizeStyles: Record<Size, string> = {
  sm: "h-8 w-8 rounded-md",
  md: "h-9 w-9 rounded-md",
  lg: "h-10 w-10 rounded-lg",
};

const hierarchyStyles: Record<Hierarchy, string> = {
  primary: "bg-brand-600 text-white shadow-xs hover:bg-brand-700",
  secondary:
    "bg-bg-primary text-text-secondary border border-border-primary shadow-xs hover:bg-bg-tertiary",
  tertiary: "text-text-secondary hover:bg-bg-tertiary hover:text-text-primary",
  destructive: "bg-error-600 text-white shadow-xs hover:bg-error-700",
  "link-color": "text-brand-400 hover:text-brand-300 h-auto px-0",
  "link-gray": "text-text-secondary hover:text-text-primary h-auto px-0",
};

export function Button({
  hierarchy = "secondary",
  size = "md",
  icon,
  iconPosition = "left",
  iconOnly = false,
  className,
  children,
  ...rest
}: ButtonProps) {
  const isLink = hierarchy === "link-color" || hierarchy === "link-gray";
  return (
    <button
      className={cn(
        base,
        !isLink && (iconOnly ? iconOnlySizeStyles[size] : sizeStyles[size]),
        hierarchyStyles[hierarchy],
        className
      )}
      {...rest}
    >
      {icon && iconPosition === "left" && <Icon name={icon} size={size === "sm" ? 16 : 18} />}
      {!iconOnly && children}
      {icon && iconPosition === "right" && <Icon name={icon} size={size === "sm" ? 16 : 18} />}
    </button>
  );
}
