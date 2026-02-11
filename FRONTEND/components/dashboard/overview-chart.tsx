"use client";

import { useState } from "react";
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
import GlassCard from "./glass-card";
import ChartTypeSelector, { type ChartType } from "./chart-type-selector";
import {
  mockLineChartData,
  mockBarChartData,
  mockScatterData,
} from "@/lib/mock-data";

const COLORS = {
  primary: "hsl(168, 70%, 45%)",
  secondary: "hsl(220, 70%, 55%)",
  tertiary: "hsl(35, 90%, 55%)",
  grid: "rgba(255,255,255,0.04)",
  axis: "rgba(255,255,255,0.3)",
};

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass rounded-xl p-3 text-xs min-w-[140px]">
      <p className="text-foreground font-medium mb-2">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-muted-foreground">{entry.name}</span>
          </span>
          <span className="text-foreground font-mono">
            {entry.value.toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  );
}

function renderLineChart() {
  return (
    <ResponsiveContainer width="100%" height={320}>
      <LineChart data={mockLineChartData}>
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
        <Legend
          wrapperStyle={{ fontSize: "12px", color: COLORS.axis }}
        />
        <Line
          type="monotone"
          dataKey="users"
          stroke={COLORS.primary}
          strokeWidth={2.5}
          dot={{ fill: COLORS.primary, r: 4, strokeWidth: 0 }}
          activeDot={{ r: 6, strokeWidth: 2, stroke: "rgba(255,255,255,0.2)" }}
        />
        <Line
          type="monotone"
          dataKey="transactions"
          stroke={COLORS.secondary}
          strokeWidth={2}
          dot={{ fill: COLORS.secondary, r: 3, strokeWidth: 0 }}
        />
        <Line
          type="monotone"
          dataKey="revenue"
          stroke={COLORS.tertiary}
          strokeWidth={2}
          dot={{ fill: COLORS.tertiary, r: 3, strokeWidth: 0 }}
          strokeDasharray="5 5"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

function renderBarChart() {
  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={mockBarChartData}>
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
          tickFormatter={(v: number) =>
            v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v)
          }
        />
        <Tooltip content={<CustomTooltip />} />
        <Bar
          dataKey="value"
          fill={COLORS.primary}
          radius={[6, 6, 0, 0]}
          maxBarSize={48}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

function renderScatterChart() {
  return (
    <ResponsiveContainer width="100%" height={320}>
      <ScatterChart>
        <CartesianGrid stroke={COLORS.grid} strokeDasharray="3 3" />
        <XAxis
          type="number"
          dataKey="hour"
          name="Hour"
          tick={{ fill: COLORS.axis, fontSize: 12 }}
          axisLine={{ stroke: COLORS.grid }}
          tickLine={false}
          domain={[0, 23]}
          label={{ value: "Hour of Day", position: "bottom", fill: COLORS.axis, fontSize: 11 }}
        />
        <YAxis
          type="number"
          dataKey="amount"
          name="Amount"
          tick={{ fill: COLORS.axis, fontSize: 12 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}K`}
          label={{
            value: "Amount ($)",
            angle: -90,
            position: "insideLeft",
            fill: COLORS.axis,
            fontSize: 11,
          }}
        />
        <Tooltip
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const d = payload[0].payload;
            return (
              <div className="glass rounded-xl p-3 text-xs">
                <p className="text-foreground font-medium">
                  ${d.amount.toLocaleString()}
                </p>
                <p className="text-muted-foreground">
                  Hour: {d.hour}:00 | Count: {d.count}
                </p>
              </div>
            );
          }}
        />
        <Scatter
          data={mockScatterData}
          fill={COLORS.primary}
          opacity={0.7}
        />
      </ScatterChart>
    </ResponsiveContainer>
  );
}

export default function OverviewChart() {
  const [chartType, setChartType] = useState<ChartType>("line");

  const titles: Record<ChartType, string> = {
    line: "Users & Revenue Trend",
    bar: "Device Traffic",
    scatter: "Transaction Distribution",
  };

  return (
    <GlassCard
      title={titles[chartType]}
      action={
        <ChartTypeSelector value={chartType} onChange={setChartType} />
      }
    >
      <div className="animate-fade-in" key={chartType}>
        {chartType === "line" && renderLineChart()}
        {chartType === "bar" && renderBarChart()}
        {chartType === "scatter" && renderScatterChart()}
      </div>
    </GlassCard>
  );
}
