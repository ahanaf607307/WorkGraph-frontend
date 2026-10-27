import React from "react";
import { cn } from "../../lib/utils";

export const Card: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  children,
  ...props
}) => {
  return (
    <div
      className={cn(
        "rounded-2xl border border-zinc-200/70 dark:border-white/[0.06] bg-white dark:bg-[#0f1118] shadow-xs transition-all",
        props.onClick && "cursor-pointer hover:border-violet-500/40 dark:hover:border-violet-500/30",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  children,
  ...props
}) => {
  return (
    <div className={cn("p-6 pb-4 flex flex-col space-y-1.5", className)} {...props}>
      {children}
    </div>
  );
};

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  className,
  children,
  ...props
}) => {
  return (
    <h3
      className={cn(
        "text-base font-bold leading-none tracking-tight text-zinc-950 dark:text-white",
        className
      )}
      {...props}
    >
      {children}
    </h3>
  );
};

export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({
  className,
  children,
  ...props
}) => {
  return (
    <p
      className={cn("text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed", className)}
      {...props}
    >
      {children}
    </p>
  );
};

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  children,
  ...props
}) => {
  return <div className={cn("p-6 pt-0", className)} {...props}>{children}</div>;
};

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  children,
  ...props
}) => {
  return (
    <div
      className={cn("p-6 pt-0 flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800/80 mt-4", className)}
      {...props}
    >
      {children}
    </div>
  );
};
