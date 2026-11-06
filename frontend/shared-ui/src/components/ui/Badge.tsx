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
    default: "bg-slate-100 text-slate-800 border border-slate-200/90",
    success: "bg-emerald-50 text-emerald-800 border border-emerald-200/90",
    warning: "bg-amber-50 text-amber-900 border border-amber-200/90",
    danger: "bg-rose-50 text-rose-800 border border-rose-200/90",
    gold: "bg-amber-50 text-amber-900 border border-amber-300 font-semibold shadow-xs",
    info: "bg-sky-50 text-sky-800 border border-sky-200/90",
    outline: "bg-transparent text-slate-700 border border-slate-300",
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
