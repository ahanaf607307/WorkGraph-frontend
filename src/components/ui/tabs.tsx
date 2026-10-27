"use client";

import React, { createContext, useContext, useState } from "react";
import { cn } from "../../lib/utils";

interface TabsContextType {
  value: string;
  onValueChange: (val: string) => void;
}

const TabsContext = createContext<TabsContextType | undefined>(undefined);

export const Tabs: React.FC<{
  defaultValue?: string;
  value?: string;
  onValueChange?: (val: string) => void;
  className?: string;
  children: React.ReactNode;
}> = ({ defaultValue, value: controlledValue, onValueChange, className, children }) => {
  const [internalValue, setInternalValue] = useState(defaultValue || "");
  const value = controlledValue !== undefined ? controlledValue : internalValue;

  const handleValueChange = (newVal: string) => {
    if (controlledValue === undefined) {
      setInternalValue(newVal);
    }
    onValueChange?.(newVal);
  };

  return (
    <TabsContext.Provider value={{ value, onValueChange: handleValueChange }}>
      <div className={cn("w-full space-y-4", className)}>{children}</div>
    </TabsContext.Provider>
  );
};

export const TabsList: React.FC<{
  className?: string;
  children: React.ReactNode;
}> = ({ className, children }) => {
  return (
    <div
      className={cn(
        "inline-flex items-center justify-start rounded-xl bg-white dark:bg-[#0f1118] p-1 text-zinc-500 border border-zinc-200/70 dark:border-white/[0.06] shadow-xs overflow-x-auto max-w-full gap-1",
        className
      )}
    >
      {children}
    </div>
  );
};

export const TabsTrigger: React.FC<{
  value: string;
  className?: string;
  children: React.ReactNode;
  disabled?: boolean;
}> = ({ value, className, children, disabled = false }) => {
  const ctx = useContext(TabsContext);
  const isActive = ctx?.value === value;

  return (
    <button
      type="button"
      role="tab"
      disabled={disabled}
      aria-selected={isActive}
      onClick={() => ctx?.onValueChange(value)}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-lg px-3.5 py-1.5 text-xs font-medium transition-all focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 cursor-pointer gap-2",
        isActive
          ? "bg-violet-600 text-white shadow-xs font-semibold"
          : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800/50",
        className
      )}
    >
      {children}
    </button>
  );
};

export const TabsContent: React.FC<{
  value: string;
  className?: string;
  children: React.ReactNode;
}> = ({ value, className, children }) => {
  const ctx = useContext(TabsContext);
  if (ctx?.value !== value) return null;

  return (
    <div
      role="tabpanel"
      className={cn("mt-2 focus-visible:outline-none animate-in fade-in duration-150", className)}
    >
      {children}
    </div>
  );
};
