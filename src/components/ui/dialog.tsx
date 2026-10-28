"use client";

import React, { createContext, useContext, useEffect } from "react";
import { cn } from "../../lib/utils";
import { X } from "lucide-react";

interface DialogContextType {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DialogContext = createContext<DialogContextType | undefined>(undefined);

export const Dialog: React.FC<{
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}> = ({ open = false, onOpenChange = () => {}, children }) => {
  return (
    <DialogContext.Provider value={{ open, onOpenChange }}>
      {children}
    </DialogContext.Provider>
  );
};

export const DialogTrigger: React.FC<{
  children: React.ReactNode;
  asChild?: boolean;
  className?: string;
  onClick?: () => void;
}> = ({ children, className, onClick }) => {
  const ctx = useContext(DialogContext);
  return (
    <div
      className={cn("inline-flex cursor-pointer", className)}
      onClick={() => {
        onClick?.();
        ctx?.onOpenChange(true);
      }}
    >
      {children}
    </div>
  );
};

export const DialogContent: React.FC<{
  children: React.ReactNode;
  className?: string;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl";
}> = ({ children, className, maxWidth = "md" }) => {
  const ctx = useContext(DialogContext);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") ctx?.onOpenChange(false);
    };
    if (ctx?.open) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [ctx?.open, ctx]);

  if (!ctx?.open) return null;

  const maxWidths = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl lg:max-w-2xl",
    "2xl": "max-w-2xl lg:max-w-3xl",
    "3xl": "max-w-3xl lg:max-w-4xl",
    "4xl": "max-w-4xl lg:max-w-5xl",
    "5xl": "max-w-5xl lg:max-w-6xl",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={() => ctx.onOpenChange(false)}
      />

      {/* Dialog Window */}
      <div
        className={cn(
          "relative w-full rounded-2xl bg-white dark:bg-[#0f1118] border border-zinc-200/80 dark:border-white/[0.08] p-6 shadow-2xl z-10 animate-in zoom-in-95 duration-200",
          maxWidths[maxWidth],
          className
        )}
      >
        <button
          type="button"
          onClick={() => ctx.onOpenChange(false)}
          className="absolute top-4 right-4 p-1.5 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
          <span className="sr-only">Close</span>
        </button>

        {children}
      </div>
    </div>
  );
};

export const DialogHeader: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => (
  <div className={cn("flex flex-col space-y-1.5 text-left mb-4 pr-6", className)}>
    {children}
  </div>
);

export const DialogFooter: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => (
  <div className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 pt-4 border-t border-zinc-100 dark:border-zinc-800", className)}>
    {children}
  </div>
);

export const DialogTitle: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => (
  <h2 className={cn("text-lg font-bold leading-none tracking-tight text-zinc-950 dark:text-white", className)}>
    {children}
  </h2>
);

export const DialogDescription: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => (
  <p className={cn("text-xs text-zinc-500 dark:text-zinc-400 mt-1", className)}>
    {children}
  </p>
);
