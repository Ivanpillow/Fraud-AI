"use client";

import React, { useState } from "react";
import {
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  ChevronDown,
  ChevronUp,
  DollarSign,
  Truck,
  Tag,
  Receipt,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface FraudResult {
  transaction_id: number;
  fraud_probability: number;
  decision: string;
  model_scores: {
    random_forest: number;
    logistic_regression: number;
    kmeans_anomaly: number;
  };
  explanations?: unknown;
}

type TaxCode = "MX" | "US" | "EU";

interface Props {
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  selectedTax: TaxCode | null;
  onTaxChange: (value: TaxCode | null) => void;
  onSubtotalChange: (value: number) => void;
  fraudResult: FraudResult | null;
}

function getDecisionInfo(decision: string) {
  switch (decision) {
    case "allow":
      return {
        icon: ShieldCheck,
        color: "text-emerald-400",
        bg: "bg-emerald-500/10 border-emerald-500/20",
        label: "Transacción Aprobada",
        description: "Esta transacción ha sido aprobada por el sistema de IA.",
      };
    case "review":
      return {
        icon: ShieldAlert,
        color: "text-amber-400",
        bg: "bg-amber-500/10 border-amber-500/20",
        label: "En Revisión",
        description:
          "Esta transacción ha sido marcada para revisión manual por un administrador.",
      };
    case "block":
      return {
        icon: ShieldX,
        color: "text-red-400",
        bg: "bg-red-500/10 border-red-500/20",
        label: "Transacción Bloqueada",
        description:
          "Esta transacción tiene una alta probabilidad de fraude y fue bloqueada.",
      };
    default:
      return {
        icon: ShieldCheck,
        color: "text-muted-foreground",
        bg: "bg-white/5 border-white/10",
        label: "Desconocido",
        description: "",
      };
  }
}

export default function OrderSummary({
  subtotal,
  taxRate,
  taxAmount,
  total,
  onSubtotalChange,
  fraudResult,
  selectedTax,
  onTaxChange,
}: Props) {
  const [showDetails, setShowDetails] = useState(false);
  const discount = 0;
  const shipping = 0;

  const decisionInfo = fraudResult ? getDecisionInfo(fraudResult.decision) : null;
  const DecisionIcon = decisionInfo?.icon;

  return (
    <div className="glass-checkout-summary rounded-3xl p-6 flex flex-col gap-5 sticky top-8">
      <h2 className="text-xl font-bold text-foreground">Resumen del Pago</h2>

      {/* Order Total */}
      <div className="text-center py-4 border-b border-white/10">
        <p className="text-sm text-muted-foreground">Total de la Orden</p>
        <p className="text-4xl font-bold text-foreground mt-1 tracking-tight">
          ${total > 0 ? total.toFixed(2) : "0.00"}
        </p>
      </div>

      {/* Editable Subtotal */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-muted-foreground">
          <DollarSign size={16} />
          <span className="text-sm">Subtotal</span>
        </div>
        <div className="relative w-32">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
            $
          </span>
          <input
            type="number"
            value={subtotal || ""}
            onChange={(e) => onSubtotalChange(parseFloat(e.target.value) || 0)}
            placeholder="0.00"
            step="0.01"
            min="0"
            className="checkout-input text-right pl-7 pr-3 py-2 text-sm w-full"
          />
        </div>
      </div>

      <div className="flex gap-2 mt-2">
        {Object.entries({ MX: 0.16, US: 0.08, EU: 0.20 }).map(([key, rate]) => {
          const active = selectedTax === key;

          return (
            <button
              key={key}
              type="button"
              onClick={() => onTaxChange(active ? null : key as TaxCode)}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs transition-all duration-300 border",
                active
                  ? "bg-green-500/20 border-green-400 text-green-300"
                  : "bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10"
              )}
            >
              {key} {(rate * 100).toFixed(0)}%
            </button>
          );
        })}
      </div>

      {/* Discounts (show only) */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Tag size={16} />
          <span className="text-sm">Descuentos</span>
        </div>
        <span className="text-sm text-muted-foreground">-$0.00</span>
      </div>

      {/* Shipping (show only, 0) */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Truck size={16} />
          <span className="text-sm">Envío</span>
        </div>
        <span className="text-sm text-emerald-400">Gratis</span>
      </div>

      {/* Tax */}
      <div className="flex items-center justify-between border-t border-white/10 pt-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Receipt size={16} />
          <span className="text-sm">
            Impuesto ({(taxRate * 100).toFixed(0)}%)
          </span>
        </div>
        <span className="text-sm text-foreground">${taxAmount.toFixed(2)}</span>
      </div>

      {/* Total */}
      <div className="flex items-center justify-between border-t border-white/10 pt-4">
        <span className="text-base font-bold text-foreground">Total</span>
        <span className="text-lg font-bold text-foreground">
          ${total > 0 ? total.toFixed(2) : "0.00"}
        </span>
      </div>

      {/* ── Fraud Analysis Results ── */}
      {fraudResult && decisionInfo && DecisionIcon && (
        <div className="border-t border-white/10 pt-5 animate-fade-in">
          <h3 className="text-sm font-semibold text-foreground/70 uppercase tracking-wider mb-4">
            Análisis de Fraude
          </h3>

          {/* Decision Badge */}
          <div
            className={cn(
              "rounded-2xl border p-4 flex items-start gap-3",
              decisionInfo.bg
            )}
          >
            <DecisionIcon size={22} className={cn(decisionInfo.color, "shrink-0 mt-0.5")} />
            <div>
              <p className={cn("font-semibold text-sm", decisionInfo.color)}>
                {decisionInfo.label}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {decisionInfo.description}
              </p>
            </div>
          </div>

          {/* Probability Bar */}
          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Probabilidad de Fraude</span>
              <span
                className={cn(
                  "font-mono font-bold",
                  fraudResult.fraud_probability >= 0.75
                    ? "text-red-400"
                    : fraudResult.fraud_probability >= 0.45
                    ? "text-amber-400"
                    : "text-emerald-400"
                )}
              >
                {(fraudResult.fraud_probability * 100).toFixed(1)}%
              </span>
            </div>
            <div className="w-full h-3 rounded-full bg-white/10 overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-1000 ease-out",
                  fraudResult.fraud_probability >= 0.75
                    ? "bg-gradient-to-r from-red-500 to-red-400"
                    : fraudResult.fraud_probability >= 0.45
                    ? "bg-gradient-to-r from-amber-500 to-yellow-400"
                    : "bg-gradient-to-r from-emerald-500 to-green-400"
                )}
                style={{ width: `${fraudResult.fraud_probability * 100}%` }}
              />
            </div>
          </div>

          {/* Model Scores Toggle */}
          <button
            type="button"
            onClick={() => setShowDetails(!showDetails)}
            className="mt-4 flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors w-full"
          >
            {showDetails ? (
              <ChevronUp size={14} />
            ) : (
              <ChevronDown size={14} />
            )}
            <span>Puntuaciones de Modelos de IA</span>
          </button>

          {showDetails && (
            <div className="mt-3 space-y-2 animate-fade-in">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Random Forest</span>
                <span className="text-foreground font-mono">
                  {(fraudResult.model_scores.random_forest * 100).toFixed(2)}%
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">
                  Regresión Logística
                </span>
                <span className="text-foreground font-mono">
                  {(fraudResult.model_scores.logistic_regression * 100).toFixed(
                    2
                  )}
                  %
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">KMeans</span>
                <span className="text-foreground font-mono">
                  {(fraudResult.model_scores.kmeans_anomaly * 100).toFixed(2)}%
                </span>
              </div>
              <div className="flex justify-between text-xs border-t border-white/5 pt-2 mt-2">
                <span className="text-muted-foreground">ID de Transacción</span>
                <span className="text-foreground font-mono">
                  #{fraudResult.transaction_id}
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
