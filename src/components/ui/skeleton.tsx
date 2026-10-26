import React from "react";
import { cn } from "../../lib/utils";

export const Skeleton: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  ...props
}) => {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-zinc-200/80 dark:bg-zinc-800",
        className
      )}
      {...props}
    />
  );
};

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number; // 0 to 100
  indicatorColor?: string;
}

export const Progress: React.FC<ProgressProps> = ({
  value,
  indicatorColor = "bg-amber-400",
  className,
  ...props
}) => {
  const percentage = Math.min(100, Math.max(0, value || 0));

  return (
    <div
      className={cn(
        "relative h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800",
        className
      )}
      {...props}
    >
      <div
        className={cn("h-full transition-all duration-300 rounded-full", indicatorColor)}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
};
