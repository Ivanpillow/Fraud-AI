"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts";
import GlassCard from "./glass-card";
import { mockTransactionsByHour } from "@/lib/mock-data";

export default function TransactionsHourChart() {
  const maxAmount = Math.max(...mockTransactionsByHour.map((d) => d.amount));

  return (
    <GlassCard title="Transactions by Hour">
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={mockTransactionsByHour}>
          <CartesianGrid
            stroke="rgba(255,255,255,0.04)"
            strokeDasharray="3 3"
          />
          <XAxis
            dataKey="hour"
            tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }}
            axisLine={{ stroke: "rgba(255,255,255,0.04)" }}
            tickLine={false}
            interval={2}
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
              const d = payload[0].payload;
              return (
                <div className="glass rounded-xl p-3 text-xs">
                  <p className="text-foreground font-medium">{label}</p>
                  <p className="text-muted-foreground">
                    ${d.amount.toLocaleString()} | {d.count} txns
                  </p>
                </div>
              );
            }}
          />
          <Bar dataKey="amount" radius={[4, 4, 0, 0]} maxBarSize={16}>
            {mockTransactionsByHour.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={
                  entry.amount === maxAmount
                    ? "hsl(168, 70%, 45%)"
                    : "rgba(255,255,255,0.08)"
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </GlassCard>
  );
}
