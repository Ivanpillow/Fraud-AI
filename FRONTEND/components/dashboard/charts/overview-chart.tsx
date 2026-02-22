"use client";

import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import GlassCard from "../glass-card";
import ChartTypeSelector, { type ChartType } from "../chart-type-selector";
import { fetchTrends } from "@/lib/api";

const COLORS = {
  primary: "hsl(168, 70%, 45%)",
  secondary: "hsl(220, 70%, 55%)",
  tertiary: "hsl(35, 90%, 55%)",
  grid: "rgba(255,255,255,0.04)",
  axis: "rgba(255,255,255,0.3)",
};

type LineData = {
  name: string;
  transactions: number;
  revenue: number;
};

type BarData = {
  name: string;
  value: number;
};

type ScatterData = {
  hour: number;
  amount: number;
  count: number;
};

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: any[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="glass rounded-xl p-3 text-xs min-w-[140px]">
      <p className="text-foreground font-medium mb-2">{label}</p>
      {payload.map((entry: any) => (
        <div
          key={entry.name}
          className="flex items-center justify-between gap-4"
        >
          <span className="flex items-center gap-1.5">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-muted-foreground">{entry.name}</span>
          </span>
          <span className="text-foreground font-mono">
            {Number(entry.value).toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function OverviewChart() {
  const [chartType, setChartType] = useState<ChartType>("line");
  const [lineData, setLineData] = useState<LineData[]>([]);
  const [barData, setBarData] = useState<BarData[]>([]);
  const [scatterData, setScatterData] = useState<ScatterData[]>([]);

  useEffect(() => {
    const load = async () => {
      const res = await fetchTrends();
      if (res.data) {
        setLineData(res.data.line);
        setBarData(res.data.bar);
        setScatterData(res.data.scatter);
      }
    };
    load();
  }, []);

  const titles: Record<ChartType, string> = {
    line: "Tendencias de Transacciones e Ingresos",
    bar: "Volumen de Transacciones por tipo de Dispositivo",
    scatter: "Distribución de Transacciones por Hora",
  };

  return (
    <GlassCard
      title={titles[chartType]}
      action={
        <ChartTypeSelector value={chartType} onChange={setChartType} />
      }
    >
      <p className="text-xs text-muted-foreground mb-2">
        Visualiza tendencias operativas del sistema incluyendo volumen de transacciones, ingresos y comportamiento horario.
      </p>

      <div className="animate-fade-in" key={chartType}>
        {chartType === "line" && (
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={lineData}>
              <CartesianGrid stroke={COLORS.grid} strokeDasharray="3 3" />
              <XAxis
                dataKey="name"
                tick={{ fill: COLORS.axis, fontSize: 12 }}
                axisLine={{ stroke: COLORS.grid }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: COLORS.axis, fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: "12px" }} />
              <Line
                type="monotone"
                dataKey="transactions"
                stroke={COLORS.secondary}
                strokeWidth={2}
                name="Transactions"
              />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke={COLORS.tertiary}
                strokeWidth={2}
                strokeDasharray="5 5"
                name="Revenue"
              />
            </LineChart>
          </ResponsiveContainer>
        )}

        {chartType === "bar" && (
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={barData}>
              <CartesianGrid stroke={COLORS.grid} strokeDasharray="3 3" />
              <XAxis
                dataKey="name"
                tick={{ fill: COLORS.axis, fontSize: 12 }}
                axisLine={{ stroke: COLORS.grid }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: COLORS.axis, fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="value"
                fill={COLORS.primary}
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        )}

        {chartType === "scatter" && (
          <ResponsiveContainer width="100%" height={320}>
            <ScatterChart>
              <CartesianGrid stroke={COLORS.grid} strokeDasharray="3 3" />
              <XAxis
                type="number"
                dataKey="hour"
                domain={[0, 23]}
                tick={{ fill: COLORS.axis, fontSize: 12 }}
                axisLine={{ stroke: COLORS.grid }}
                tickLine={false}
                label={{
                  value: "Hour of Day",
                  position: "insideBottom",
                  offset: -5,
                  fill: COLORS.axis,
                  fontSize: 12,
                }}
              />
              <YAxis
                type="number"
                dataKey="amount"
                tick={{ fill: COLORS.axis, fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                label={{
                  value: "Amount ($)",
                  angle: -90,
                  position: "insideLeft",
                  fill: COLORS.axis,
                  fontSize: 12,
                }}
              />
              <Tooltip />
              <Scatter
                data={scatterData}
                fill={COLORS.primary}
                opacity={0.7}
              />
            </ScatterChart>
          </ResponsiveContainer>
        )}
      </div>
    </GlassCard>
  );
}