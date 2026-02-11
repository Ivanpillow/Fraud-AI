"use client";

import { BarChart3, LineChart, ScatterChart } from "lucide-react";
import { cn } from "@/lib/utils";

export type ChartType = "line" | "bar" | "scatter";

interface ChartTypeSelectorProps {
  value: ChartType;
  onChange: (type: ChartType) => void;
}

const options: { type: ChartType; icon: typeof BarChart3; label: string }[] = [
  { type: "line", icon: LineChart, label: "Line" },
  { type: "bar", icon: BarChart3, label: "Bar" },
  { type: "scatter", icon: ScatterChart, label: "Scatter" },
];

export default function ChartTypeSelector({
  value,
  onChange,
}: ChartTypeSelectorProps) {
  return (
    <div className="flex items-center rounded-xl glass p-1 gap-0.5">
      {options.map((opt) => (
        <button
          key={opt.type}
          onClick={() => onChange(opt.type)}
          className={cn(
            "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200",
            "active:scale-[0.95]",
            value === opt.type
              ? "bg-primary/15 text-primary shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
          aria-label={`Show ${opt.label} chart`}
        >
          <opt.icon size={14} />
          <span className="hidden sm:inline">{opt.label}</span>
        </button>
      ))}
    </div>
  );
}
