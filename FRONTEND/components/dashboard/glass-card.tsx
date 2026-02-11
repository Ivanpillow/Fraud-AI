"use client";

import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  title?: string;
  action?: ReactNode;
  noPadding?: boolean;
}

export default function GlassCard({
  children,
  className,
  title,
  action,
  noPadding = false,
}: GlassCardProps) {
  return (
    <div
      className={cn(
        "glass-card rounded-2xl",
        !noPadding && "p-5",
        className
      )}
    >
      {(title || action) && (
        <div className={cn("flex items-center justify-between", !noPadding ? "mb-4" : "px-5 pt-5 mb-4")}>
          {title && (
            <h3 className="text-sm font-semibold text-primary">{title}</h3>
          )}
          {action && <div>{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
}
