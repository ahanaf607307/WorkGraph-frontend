"use client";

import React, { useEffect } from "react";
import { cn } from "../../lib/utils";
import { X } from "lucide-react";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl";
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  className,
  maxWidth = "md",
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidths = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
    "3xl": "max-w-3xl",
    "4xl": "max-w-4xl",
    "5xl": "max-w-5xl",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div
        className={cn(
          "relative w-full rounded-2xl bg-white dark:bg-[#0f1118] border border-zinc-200/70 dark:border-white/[0.08] p-6 shadow-2xl z-10 animate-in zoom-in-95 duration-200",
          maxWidths[maxWidth],
          className
        )}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-50 p-2 text-zinc-400 hover:text-zinc-950 dark:hover:text-white rounded-xl hover:bg-zinc-100 dark:hover:bg-white/[0.08] transition-all cursor-pointer pointer-events-auto shadow-xs border border-transparent dark:border-white/[0.04]"
          title="Close modal"
        >
          <X className="w-4 h-4" />
        </button>

        {title && (
          <div className="mb-4 pr-12">
            <h2 className="text-lg font-bold text-zinc-950 dark:text-white">{title}</h2>
            {description && <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">{description}</p>}
          </div>
        )}

        {children}
      </div>
    </div>
  );
};
