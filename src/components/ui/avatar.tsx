import React from "react";
import { cn, getInitials } from "../../lib/utils";

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string | null;
  name?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  name,
  size = "md",
  className,
  ...props
}) => {
  const sizes = {
    sm: "h-7 w-7 text-xs",
    md: "h-9 w-9 text-xs",
    lg: "h-11 w-11 text-sm font-semibold",
    xl: "h-14 w-14 text-base font-bold",
  };

  return (
    <div
      className={cn(
        "relative rounded-full flex items-center justify-center overflow-hidden font-bold bg-zinc-950 text-amber-400 select-none ring-2 ring-white dark:ring-black border border-amber-400/40 shadow-xs",
        sizes[size],
        className
      )}
      {...props}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={name || "Avatar"} className="h-full w-full object-cover" />
      ) : (
        <span>{getInitials(name)}</span>
      )}
    </div>
  );
};
