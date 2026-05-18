"use client";

import { useEffect, useMemo, useState } from "react";
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
import { fetchFraudsByHour } from "@/lib/api";

type FraudHourPoint = {
  hour: string;
  count: number;
};

const COLORS = [
  "hsl(168, 70%, 45%)",
  "hsl(180, 58%, 42%)",
  "hsl(196, 62%, 46%)",
  "hsl(210, 68%, 52%)",
  "hsl(224, 60%, 48%)",
];

type ConversionFunnelProps = {
  merchantId?: number;
};

export default function ConversionFunnel({ merchantId }: ConversionFunnelProps) {
  const [data, setData] = useState<FraudHourPoint[]>([]);

  useEffect(() => {
    let isActive = true;
    setData([]);

    const load = async () => {
      const response = await fetchFraudsByHour(undefined, merchantId);

      if (!isActive || !response.data) {
        return;
      }

      const fraudByHour = new Map<number, number>(
        response.data.map((entry) => [entry.hour, entry.count])
      );

      const formatted = Array.from({ length: 24 }, (_, hour) => ({
        hour: `${String(hour).padStart(2, "0")}:00`,
        count: fraudByHour.get(hour) ?? 0,
      }));

      setData(formatted);
    };

    load();

    return () => {
      isActive = false;
    };
  }, [merchantId]);

  const maxCount = useMemo(
    () => (data.length > 0 ? Math.max(...data.map((entry) => entry.count)) : 0),
    [data]
  );


  return (
    <GlassCard title="Fraudes detectados por hora">
      <p className="text-xs text-muted-foreground mb-2">
        Número de casos de fraude detectados en cada hora del día.
      </p>
      <ResponsiveContainer width="100%" height={320}>
        <BarChart
          data={data}
        >
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
            tickFormatter={(v: number) => String(v)}
            label={{
              value: "Casos de fraude",
              angle: -90,
              position: "insideLeft",
              fill: "rgba(255,255,255,0.4)",
              fontSize: 12,
            }}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              const d = payload[0].payload as FraudHourPoint;
              return (
                <div className="glass rounded-xl p-3 text-xs">
                  <p className="text-foreground font-medium">{label}</p>
                  <p className="text-muted-foreground">
                    {d.count.toLocaleString()} casos detectados
                  </p>
                </div>
              );
            }}
          />
          <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={18}>
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.count > 0 && entry.count === maxCount ? COLORS[0] : COLORS[index % COLORS.length]}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </GlassCard>
  );
}
