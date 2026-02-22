"use client";

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from "recharts";
import GlassCard from "../glass-card";
import { mockAnalyticsChartData } from "@/lib/mock-data";
import { useEffect, useState } from "react";
import { fetchTransactionsByCountry } from "@/lib/api";

const COLORS = [
  "hsl(168, 70%, 45%)",
  "hsl(220, 70%, 55%)",
  "hsl(35, 90%, 55%)",
  "hsl(280, 60%, 55%)",
  "hsl(0, 72%, 55%)",
];

export default function RevenueByLocation() {

  const [data, setData] = useState<any[]>([]);
  useEffect(() => {
    const loadData = async () => {
      const response = await fetchTransactionsByCountry();

      if (response.data) {
        setData(response.data);
      }
    };

    loadData();
  }, []);

  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <GlassCard title="Ingresos por Ubicación">
      <p className="text-xs text-muted-foreground mb-2">
        Distribución de ingresos por ubicación geográfica..
      </p>
      <div className="flex flex-col md:flex-row items-center gap-6">
        <div className="w-[200px] h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={90}
                paddingAngle={3}
                dataKey="value"
                strokeWidth={0}
              >
                {data.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0].payload;
                  return (
                    <div className="glass rounded-xl p-3 text-xs">
                      <p className="text-foreground font-medium">{d.name}</p>
                      <p className="text-muted-foreground">
                        ${d.value.toLocaleString()}
                      </p>
                    </div>
                  );
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="flex flex-col gap-3 flex-1">
          {data.map((location, i) => {
            const pct = ((location.value / total) * 100).toFixed(1);
            return (
              <div key={location.name} className="flex items-center gap-3">
                <span
                  className="h-3 w-3 rounded-sm shrink-0"
                  style={{ backgroundColor: COLORS[i] }}
                />
                <span className="text-sm text-foreground flex-1">
                  {location.name}
                </span>
                <span className="text-sm font-mono text-muted-foreground">
                  ${(location.value / 1000).toFixed(0)}K
                </span>
                <span className="text-xs text-muted-foreground w-10 text-right">
                  {pct}%
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </GlassCard>
  );
}
