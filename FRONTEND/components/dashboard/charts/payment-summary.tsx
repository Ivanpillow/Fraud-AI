"use client";

import { CheckCircle, XCircle, Clock, DollarSign } from "lucide-react";
import GlassCard from "../glass-card";
import { mockPaymentSummary } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

import { useEffect, useState } from "react";
import { fetchOverviewMetrics } from "@/lib/api";

const items = [
  {
    label: "Successful",
    key: "successful" as const,
    icon: CheckCircle,
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    label: "Failed",
    key: "failed" as const,
    icon: XCircle,
    color: "text-destructive",
    bg: "bg-destructive/10",
  },
  {
    label: "Pending",
    key: "pending" as const,
    icon: Clock,
    color: "text-[hsl(var(--warning))]",
    bg: "bg-[hsl(var(--warning))]/10",
  },
];


type PaymentSummaryData = {
  total_payments: number;
  successful: number;
  failed: number;
  pending: number;
  average_amount: number;
};


export default function PaymentSummary() {

  const [data, setData] = useState<PaymentSummaryData | null>(null);
  useEffect(() => {
    const load = async () => {
      const res = await fetchOverviewMetrics();
      if (res.data) {
        const decisions = res.data.decisions;

        const total =
          (decisions.allow || 0) +
          (decisions.review || 0) +
          (decisions.block || 0);

        setData({
          total_payments: total,
          successful: decisions.allow || 0,
          pending: decisions.review || 0,
          failed: decisions.block || 0,
          average_amount:
            res.data.stats.total_revenue / (res.data.stats.total_transactions || 1),
        });
      }
    };
    load();
  }, []);

  const total = data?.total_payments || 0;

  if (!data) {
    return (
      <GlassCard title="Resumen de Pagos">
        <p className="text-xs text-muted-foreground">
          Cargando resumen de pagos...
        </p>
      </GlassCard>
    );
  }

  return (
    <GlassCard title="Resumen de Pagos">
      <p className="text-xs text-muted-foreground mb-2">
        Resumen de las transacciones procesadas, mostrando el total de pagos, su estado (exitosos, fallidos, pendientes) y el monto promedio.
      </p>
      <div className="flex flex-col gap-4">
        {/* Total */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.04] text-muted-foreground">
              <DollarSign size={16} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Payments</p>
              <p className="text-lg font-bold text-foreground">
                {total.toLocaleString()}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Avg. Amount</p>
            <p className="text-sm font-mono font-semibold text-foreground">
              ${data.average_amount.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Bars */}
        <div className="flex flex-col gap-3">
          {items.map((item) => {
            const val = data[item.key];
            const pct = total > 0 ? (val / total) * 100 : 0;
            return (
              <div key={item.key} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <item.icon size={12} className={item.color} />
                    {item.label}
                  </span>
                  <span className="text-xs font-mono text-foreground">
                    {val.toLocaleString()}{" "}
                    <span className="text-muted-foreground">
                      ({pct.toFixed(1)}%)
                    </span>
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-white/[0.04]">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-700",
                      item.key === "successful"
                        ? "bg-primary"
                        : item.key === "failed"
                          ? "bg-destructive"
                          : "bg-[hsl(var(--warning))]"
                    )}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </GlassCard>
  );
}
