import React from "react";
import { cn } from "../../utils/cn";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "warning" | "danger" | "gold" | "info" | "outline";
  size?: "sm" | "md";
}

export function Badge({
  className,
  variant = "default",
  size = "md",
  children,
  ...props
}: BadgeProps) {
  const baseStyles = "inline-flex items-center font-medium rounded-full select-none";

  const variantStyles = {
    default: "bg-slate-800 text-slate-300 border border-slate-700",
    success: "bg-emerald-950/80 text-emerald-300 border border-emerald-800/60",
    warning: "bg-amber-950/80 text-amber-300 border border-amber-800/60",
    danger: "bg-rose-950/80 text-rose-300 border border-rose-800/60",
    gold: "bg-gradient-to-r from-amber-900/60 to-yellow-900/60 text-amber-200 border border-amber-600/50 shadow-sm",
    info: "bg-sky-950/80 text-sky-300 border border-sky-800/60",
    outline: "bg-transparent text-slate-300 border border-slate-600",
  };

  const sizeStyles = {
    sm: "px-2 py-0.5 text-xs gap-1",
    md: "px-2.5 py-1 text-xs gap-1.5",
  };

  return (
    <span className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)} {...props}>
      {children}
    </span>
  );
}
