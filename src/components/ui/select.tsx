import React from "react";
import { cn } from "../../lib/utils";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, id, children, ...props }, ref) => {
    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={id} className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 cursor-pointer">
            {label}
          </label>
        )}
        <select
          id={id}
          ref={ref}
          className={cn(
            "flex h-10 w-full rounded-lg border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-[#0f1118] px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/20 focus-visible:border-violet-500/70 disabled:cursor-not-allowed disabled:opacity-50 transition-colors cursor-pointer shadow-2xs",
            error && "border-rose-500 focus-visible:ring-rose-500",
            className
          )}
          {...props}
        >
          {children}
        </select>
        {error && <p className="text-xs text-rose-500">{error}</p>}
      </div>
    );
  }
);

Select.displayName = "Select";
