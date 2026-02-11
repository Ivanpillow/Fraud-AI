"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import GlassCard from "../glass-card";
import { mockAnalyticsChartData } from "@/lib/mock-data";

export default function RevenueComparison() {
  return (
    <GlassCard
      title="Revenue"
      action={
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-primary" />
            Current Week $58,211
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[hsl(220,70%,55%)]" />
            Previous Week $48,768
          </span>
        </div>
      }
    >
      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={mockAnalyticsChartData.revenue}>
          <CartesianGrid
            stroke="rgba(255,255,255,0.04)"
            strokeDasharray="3 3"
          />
          <XAxis
            dataKey="name"
            tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 12 }}
            axisLine={{ stroke: "rgba(255,255,255,0.04)" }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: number) =>
              v >= 1000 ? `$${(v / 1000).toFixed(0)}K` : `$${v}`
            }
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              return (
                <div className="glass rounded-xl p-3 text-xs">
                  <p className="text-foreground font-medium mb-1">{label}</p>
                  {payload.map((p) => (
                    <div
                      key={p.name}
                      className="flex items-center justify-between gap-4"
                    >
                      <span className="text-muted-foreground">{p.name}</span>
                      <span className="text-foreground font-mono">
                        ${Number(p.value).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              );
            }}
          />
          <Legend wrapperStyle={{ fontSize: "12px" }} />
          <Line
            type="monotone"
            dataKey="current"
            stroke="hsl(168, 70%, 45%)"
            strokeWidth={2.5}
            dot={{ fill: "hsl(168, 70%, 45%)", r: 3, strokeWidth: 0 }}
            name="Current"
          />
          <Line
            type="monotone"
            dataKey="previous"
            stroke="hsl(220, 70%, 55%)"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={{ fill: "hsl(220, 70%, 55%)", r: 3, strokeWidth: 0 }}
            name="Previous"
          />
        </LineChart>
      </ResponsiveContainer>
    </GlassCard>
  );
}
