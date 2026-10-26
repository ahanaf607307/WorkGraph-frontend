import React from "react";
import { TASK_STATUSES } from "../../config";
import { cn } from "../../lib/utils";

export const StatusBadge: React.FC<{ status: string; className?: string }> = ({
  status,
  className,
}) => {
  const match = TASK_STATUSES.find((s) => s.value === status) || {
    label: status,
    color: "bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border",
        match.color,
        className
      )}
    >
      {match.label}
    </span>
  );
};
