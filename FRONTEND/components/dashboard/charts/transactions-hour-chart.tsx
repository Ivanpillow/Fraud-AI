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
import GlassCard from "../glass-card";
import { mockTransactionsByHour } from "@/lib/mock-data";
import { useEffect, useState } from "react";
import { fetchOverviewMetrics } from "@/lib/api";

export default function TransactionsHourChart() {
  const [data, setData] = useState<any[]>([]);
    useEffect(() => {
    const load = async () => {
      const res = await fetchOverviewMetrics();
      if (res.data) {
        setData(res.data.transactions_by_hour);
      }
    };
    load();
  }, []);

  const maxAmount = data.length > 0 ? Math.max(...data.map((d) => d.amount)) : 0;
  
  return (
    <GlassCard title="Transacciones por Hora">
      <p className="text-xs text-muted-foreground mb-2">
        Distribución de transacciones a lo largo del día.
      </p>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data}>
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
            label={{
              value: "Hora del día",
              position: "insideBottom",
              offset: -5,
              fill: "rgba(255,255,255,0.4)",
              fontSize: 12,
            }}
          />
          <YAxis
            tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: number) =>
              v >= 1000 ? `$${(v / 1000).toFixed(0)}K` : `$${v}`
            }
            label={{
              value: "Monto total ($)",
              angle: -90,
              position: "insideLeft",
              fill: "rgba(255,255,255,0.4)",
              fontSize: 12,
            }}
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
            {data.map((entry, index) => (
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
