import React from "react";
import { cn } from "../../lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger" | "subtle";
  size?: "sm" | "md" | "lg" | "icon";
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", isLoading, children, disabled, ...props }, ref) => {
    const variants = {
      primary: "bg-orange-500 hover:bg-orange-600 text-white font-bold shadow-md shadow-orange-500/20 focus-visible:ring-orange-500 border border-orange-500",
      secondary: "bg-zinc-100 hover:bg-zinc-200 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700 shadow-xs focus-visible:ring-zinc-400 border border-zinc-200 dark:border-zinc-700",
      outline: "border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-orange-50 dark:hover:bg-zinc-800 text-zinc-900 dark:text-zinc-100 hover:text-orange-600 dark:hover:text-orange-400 hover:border-orange-300 dark:hover:border-orange-800 shadow-xs",
      ghost: "bg-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:text-orange-600 dark:hover:text-white",
      danger: "bg-rose-600 hover:bg-rose-700 text-white shadow-sm focus-visible:ring-rose-500",
      subtle: "bg-orange-50 hover:bg-orange-100 text-orange-900 dark:bg-orange-950/40 dark:text-orange-300 border border-orange-200/60 dark:border-orange-800/40",
    };

    const sizes = {
      sm: "h-8 px-3 text-xs rounded-md",
      md: "h-9.5 px-4 text-sm rounded-lg",
      lg: "h-11 px-6 text-base rounded-xl",
      icon: "h-9 w-9 p-0 rounded-lg flex items-center justify-center",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          "inline-flex items-center justify-center font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 disabled:opacity-50 disabled:pointer-events-none cursor-pointer active:scale-[0.98]",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {isLoading && (
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
