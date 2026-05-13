import { cn } from "@/lib/utils";
import { HTMLAttributes, ReactNode } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  /** Hover lift + pointer for clickable cards */
  interactive?: boolean;
}

export function Card({
  className,
  children,
  interactive,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-card)] border border-neutral-200/80 bg-white shadow-[var(--shadow-card)] transition-shadow duration-200",
        interactive &&
          "cursor-pointer hover:shadow-[var(--shadow-card-hover)] hover:border-neutral-300",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("border-b border-neutral-100 px-4 py-3 md:px-5", className)}
      {...props}
    />
  );
}

export function CardBody({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-4 md:p-5", className)} {...props} />;
}

export function CardFooter({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "border-t border-neutral-100 px-4 py-3 md:px-5",
        className,
      )}
      {...props}
    />
  );
}
