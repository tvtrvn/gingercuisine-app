import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import {
  cloneElement,
  isValidElement,
  type ButtonHTMLAttributes,
  type ReactElement,
  type ReactNode,
} from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  /** Pill shape for storefront CTAs */
  pill?: boolean;
  /** Merge styles onto a single child (e.g. next/link `Link`) */
  asChild?: boolean;
}

export function Button({
  variant = "primary",
  size = "md",
  loading,
  iconLeft,
  iconRight,
  pill = false,
  className,
  children,
  disabled,
  type = "button",
  asChild,
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-2 font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";

  const radius = pill ? "rounded-full" : "rounded-xl";

  const sizes: Record<NonNullable<ButtonProps["size"]>, string> = {
    sm: "px-3 py-1.5 text-xs min-h-9",
    md: "px-4 py-2.5 text-sm min-h-11",
    lg: "px-6 py-3 text-base min-h-12",
  };

  const styles: Record<NonNullable<ButtonProps["variant"]>, string> = {
    primary:
      "bg-brand-600 text-white hover:bg-brand-700 focus-visible:ring-brand-500",
    secondary:
      "bg-brand-100 text-brand-900 hover:bg-brand-50 focus-visible:ring-brand-500",
    outline:
      "border border-neutral-300 bg-white text-neutral-800 hover:bg-neutral-50 focus-visible:ring-neutral-400",
    ghost:
      "text-neutral-700 hover:bg-neutral-100 focus-visible:ring-neutral-400",
  };

  const composed = cn(base, radius, sizes[size], styles[variant], className);

  if (asChild) {
    if (!isValidElement(children)) {
      throw new Error("Button with asChild expects a single React element child.");
    }
    const child = children as ReactElement<{ className?: string }>;
    return cloneElement(child, {
      className: cn(composed, child.props.className),
    });
  }

  return (
    <button
      type={type}
      className={composed}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
      ) : (
        iconLeft
      )}
      {children}
      {!loading && iconRight}
    </button>
  );
}
