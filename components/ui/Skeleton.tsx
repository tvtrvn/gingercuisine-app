import { cn } from "@/lib/utils";
import { HTMLAttributes } from "react";

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "text" | "rect" | "circle";
}

export function Skeleton({
  className,
  variant = "rect",
  ...props
}: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-neutral-200/90 motion-reduce:animate-none",
        variant === "text" && "h-4 w-full",
        variant === "rect" && "min-h-[4rem] w-full",
        variant === "circle" && "aspect-square rounded-full",
        className,
      )}
      {...props}
    />
  );
}
