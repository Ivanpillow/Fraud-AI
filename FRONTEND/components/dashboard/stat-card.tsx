"use client";

import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  change: number;
  icon: LucideIcon;
  accent?: boolean;
}

export default function StatCard({
  label,
  value,
  change,
  icon: Icon,
  accent = false,
}: StatCardProps) {
  const isPositive = change >= 0;

  return (
    <div
      className={cn(
        "glass-card rounded-2xl p-5 flex flex-col gap-3 group cursor-default",
        accent && "border-primary/20"
      )}
    >
      <div className="flex items-center justify-between">
        <span
          className={cn(
            "text-xs font-semibold uppercase tracking-wider",
            accent ? "text-primary" : "text-muted-foreground"
          )}
        >
          {label}
        </span>
        <div
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-lg transition-colors duration-200",
            accent
              ? "bg-primary/10 text-primary"
              : "bg-white/[0.04] text-muted-foreground group-hover:text-foreground"
          )}
        >
          <Icon size={16} />
        </div>
      </div>
      <div className="flex items-end justify-between">
        <span className="text-2xl font-bold text-foreground tracking-tight">
          {typeof value === "number" ? value.toLocaleString() : value}
        </span>
        <span
          className={cn(
            "flex items-center gap-1 text-xs font-medium",
            isPositive ? "text-primary" : "text-destructive"
          )}
        >
          {isPositive ? (
            <TrendingUp size={12} />
          ) : (
            <TrendingDown size={12} />
          )}
          {isPositive ? "+" : ""}
          {change}%
        </span>
      </div>
    </div>
  );
}
