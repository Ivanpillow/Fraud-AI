"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import GlassCard from "./glass-card";
import { mockLocationData } from "@/lib/mock-data";

export default function LocationChart() {
  return (
    <GlassCard title="Location Traffic">
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={mockLocationData}>
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
              v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v)
            }
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              return (
                <div className="glass rounded-xl p-3 text-xs">
                  <p className="text-foreground font-medium">{label}</p>
                  <p className="text-muted-foreground">
                    {payload[0].value?.toLocaleString()} visits
                  </p>
                </div>
              );
            }}
          />
          <Bar
            dataKey="value"
            fill="hsl(220, 70%, 55%)"
            radius={[6, 6, 0, 0]}
            maxBarSize={40}
          />
        </BarChart>
      </ResponsiveContainer>
    </GlassCard>
  );
}
