import { cn } from "@/lib/utils";
import { HTMLAttributes } from "react";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: "info" | "success" | "warning" | "danger" | "neutral" | "brand";
  dot?: boolean;
}

const tones: Record<
  NonNullable<BadgeProps["tone"]>,
  string
> = {
  info: "border-blue-200 bg-blue-50 text-blue-900",
  success: "border-brand-200 bg-brand-50 text-brand-900",
  warning: "border-amber-200 bg-amber-50 text-amber-900",
  danger: "border-red-200 bg-red-50 text-red-900",
  neutral: "border-neutral-200 bg-neutral-100 text-neutral-800",
  brand: "border-brand-600/20 bg-brand-100 text-brand-900",
};

export function Badge({
  className,
  tone = "neutral",
  dot,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        tones[tone],
        className,
      )}
      {...props}
    >
      {dot && (
        <span
          className="h-1.5 w-1.5 shrink-0 rounded-full bg-current opacity-80"
          aria-hidden
        />
      )}
      {children}
    </span>
  );
}
