import React from "react";
import { TASK_PRIORITIES } from "../../config";
import { cn } from "../../lib/utils";

export const PriorityBadge: React.FC<{ priority: string; className?: string }> = ({
  priority,
  className,
}) => {
  const match = TASK_PRIORITIES.find((p) => p.value === priority) || {
    label: priority,
    color: "bg-slate-100 text-slate-700 border-slate-200",
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
