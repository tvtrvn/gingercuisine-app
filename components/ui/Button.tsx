import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost";
}

export function Button({
  variant = "primary",
  className,
  children,
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2";

  const styles: Record<NonNullable<ButtonProps["variant"]>, string> = {
    primary:
      "bg-emerald-600 text-white hover:bg-emerald-700 focus-visible:ring-emerald-500",
    secondary:
      "bg-amber-100 text-amber-900 hover:bg-amber-200 focus-visible:ring-amber-500",
    outline:
      "border border-neutral-300 text-neutral-800 hover:bg-neutral-100 focus-visible:ring-neutral-400",
    ghost:
      "text-neutral-700 hover:bg-neutral-100 focus-visible:ring-neutral-400",
  };

  return (
    <button
      className={cn(base, styles[variant], className)}
      {...props}
    >
      {children}
    </button>
  );
}

