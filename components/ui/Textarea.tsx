import { cn } from "@/lib/utils";
import { TextareaHTMLAttributes, forwardRef } from "react";

export interface TextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const tid = id ?? props.name;
    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={tid}
            className="mb-1.5 block text-xs font-medium text-neutral-700"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={tid}
          className={cn(
            "w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-neutral-900 shadow-sm transition-colors duration-200 placeholder:text-neutral-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-1",
            error
              ? "border-red-300 focus-visible:ring-red-500"
              : "border-neutral-300",
            className,
          )}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${tid}-error` : undefined}
          {...props}
        />
        {error && (
          <p id={`${tid}-error`} className="mt-1.5 text-xs text-red-600">
            {error}
          </p>
        )}
      </div>
    );
  },
);
Textarea.displayName = "Textarea";
