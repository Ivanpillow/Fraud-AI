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
import { mockAnalyticsChartData } from "@/lib/mock-data";

import { useEffect, useState } from "react";
import { fetchFraudFunnel } from "@/lib/api";

const COLORS = [
  "hsl(168, 70%, 45%)",
  "hsl(180, 60%, 40%)",
  "hsl(200, 65%, 45%)",
  "hsl(220, 70%, 55%)",
  "hsl(240, 60%, 50%)",
];

export default function ConversionFunnel() {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
  const loadData = async () => {
    const response = await fetchFraudFunnel();

    if (response.data) {
      const formatted = [
        { name: "Total", value: response.data.total },
        ...response.data.decisions,
      ];

      setData(formatted);
    }
  };

  loadData();
}, []);


  return (
    <GlassCard title="Embudo de Conversión de Transacciones">
      <p className="text-xs text-muted-foreground mb-2">
        Muestra la cantidad de transacciones en cada etapa del proceso de decisión de fraude. 
      </p>
      <ResponsiveContainer width="100%" height={320}>
        <BarChart
          data={data}
          layout="vertical"
        >
          <CartesianGrid
            stroke="rgba(255,255,255,0.04)"
            strokeDasharray="3 3"
            horizontal={false}
          />
          <XAxis
            type="number"
            tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: number) =>
              v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v)
            }
          />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            width={80}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const d = payload[0].payload;
              return (
                <div className="glass rounded-xl p-3 text-xs">
                  <p className="text-foreground font-medium">{d.name}</p>
                  <p className="text-muted-foreground">
                    {d.value.toLocaleString()} users
                  </p>
                </div>
              );
            }}
          />
          <Bar dataKey="value" radius={[0, 6, 6, 0]} maxBarSize={32}>
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </GlassCard>
  );
}
