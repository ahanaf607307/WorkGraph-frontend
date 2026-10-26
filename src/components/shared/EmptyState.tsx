import React from "react";
import { Button } from "../ui/button";
import { FolderKanban } from "lucide-react";

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 md:p-12 text-center rounded-2xl border-2 border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/40">
      <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-400 border border-amber-300 dark:border-amber-800/60 flex items-center justify-center mb-4 shadow-xs">
        {icon || <FolderKanban className="w-6 h-6" />}
      </div>
      <h3 className="text-base font-bold text-zinc-950 dark:text-white mb-1">{title}</h3>
      <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-sm mb-6 leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction} variant="primary" size="md">
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
