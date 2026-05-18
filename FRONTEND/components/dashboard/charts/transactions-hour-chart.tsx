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
import { useEffect, useState } from "react";
import { fetchTransactionsByHour } from "@/lib/api";

type TransactionsHourChartProps = {
  merchantId?: number;
};

type TransactionHourRow = {
  hour: number;
  amount: number;
  count: number;
};

function normalizeHourlyData(rows: TransactionHourRow[]): TransactionHourRow[] {
  const byHour = new Map<number, TransactionHourRow>();

  rows.forEach((row) => {
    const hour = Number(row.hour);
    if (!Number.isFinite(hour)) return;
    byHour.set(hour, {
      hour,
      amount: Number(row.amount) || 0,
      count: Number(row.count) || 0,
    });
  });

  return Array.from(
    { length: 24 },
    (_, hour) => byHour.get(hour) ?? { hour, amount: 0, count: 0 }
  );
}

export default function TransactionsHourChart({ merchantId }: TransactionsHourChartProps) {
  const [data, setData] = useState<TransactionHourRow[]>(() => normalizeHourlyData([]));

  useEffect(() => {
    let isActive = true;
    setData(normalizeHourlyData([]));

    const load = async () => {
      const res = await fetchTransactionsByHour(undefined, merchantId);
      if (isActive && res.data) {
        setData(normalizeHourlyData(res.data));
      }
    };

    load();

    return () => {
      isActive = false;
    };
  }, [merchantId]);

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
