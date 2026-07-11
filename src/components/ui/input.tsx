import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "prefix" | "suffix"
> {
  error?: string;
  label?: string;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, label, prefix, suffix, id, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id || generatedId;
    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="mb-1.5 block text-sm font-medium text-espresso-700"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {prefix && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-espresso-400">
              {prefix}
            </div>
          )}
          <input
            type={type}
            id={inputId}
            className={cn(
              "flex h-10 w-full rounded-lg border border-espresso-200 bg-white px-3 py-2 text-sm text-espresso-900 placeholder:text-espresso-400 transition-colors",
              "focus:border-espresso-500 focus:outline-none focus:ring-2 focus:ring-espresso-500/20",
              "disabled:cursor-not-allowed disabled:bg-espresso-50 disabled:opacity-60",
              prefix && "pl-10",
              suffix && "pr-10",
              error &&
                "border-danger-500 focus:border-danger-500 focus:ring-danger-500/20",
              className,
            )}
            ref={ref}
            {...props}
          />
          {suffix && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-espresso-400">
              {suffix}
            </div>
          )}
        </div>
        {error && <p className="mt-1 text-xs text-danger-600">{error}</p>}
      </div>
    );
  },
);
Input.displayName = "Input";

export { Input };
