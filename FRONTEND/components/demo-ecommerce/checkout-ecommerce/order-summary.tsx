"use client";

import React, { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Receipt,
  ShieldAlert,
  ShieldCheck,
  ShieldX,
  Tag,
  Truck,
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

interface Props {
  subtotal: number;
  total: number;
  fraudResult: FraudResult | null;
  onNewTransaction: () => void;
}

function getDecisionInfo(decision: string) {
  switch (decision) {
    case "allow":
      return {
        icon: ShieldCheck,
        color: "text-emerald-400",
        bg: "bg-emerald-500/10 border-emerald-500/20",
        label: "Transaccion aprobada",
        description: "El sistema antifraude no detecto riesgo relevante en esta compra.",
      };
    case "review":
      return {
        icon: ShieldAlert,
        color: "text-amber-400",
        bg: "bg-amber-500/10 border-amber-500/20",
        label: "En revision",
        description: "La transaccion requiere validacion manual antes de confirmar.",
      };
    case "block":
      return {
        icon: ShieldX,
        color: "text-red-400",
        bg: "bg-red-500/10 border-red-500/20",
        label: "Transaccion bloqueada",
        description: "La operacion fue bloqueada por alto riesgo de fraude.",
      };
    default:
      return {
        icon: ShieldCheck,
        color: "text-muted-foreground",
        bg: "bg-white/5 border-white/10",
        label: "Resultado no disponible",
        description: "",
      };
  }
}

export default function DemoLibreriaOrderSummary({
  subtotal,
  total,
  fraudResult,
  onNewTransaction,
}: Props) {
  const [showDetails, setShowDetails] = useState(false);
  const decisionInfo = fraudResult ? getDecisionInfo(fraudResult.decision) : null;
  const DecisionIcon = decisionInfo?.icon;

  return (
    <div className="glass-checkout-summary rounded-3xl p-6 flex flex-col gap-5 sticky top-8">
      <h2 className="text-xl font-bold text-foreground">Resumen del pedido</h2>

      <div className="text-center py-4 border-b border-white/10">
        <p className="text-sm text-muted-foreground">Total a pagar</p>
        <p className="text-4xl font-bold text-foreground mt-1 tracking-tight">${total.toFixed(2)}</p>
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Subtotal libros</span>
        <span className="font-semibold text-foreground">${subtotal.toFixed(2)}</span>
      </div>

      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Tag size={16} />
          <span>Descuentos</span>
        </div>
        <span className="text-muted-foreground">-$0.00</span>
      </div>

      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Truck size={16} />
          <span>Envio</span>
        </div>
        <span className="text-emerald-400">Gratis</span>
      </div>

      <div className="flex items-center justify-between border-t border-white/10 pt-4">
        <span className="text-base font-bold text-foreground">Total</span>
        <span className="text-lg font-bold text-foreground">${total.toFixed(2)}</span>
      </div>

      {fraudResult && decisionInfo && DecisionIcon && (
        <div className="border-t border-white/10 pt-5 animate-fade-in">
          <h3 className="text-sm font-semibold text-foreground/70 uppercase tracking-wider mb-4">
            Resultado antifraude
          </h3>

          <div className={cn("rounded-2xl border p-4 flex items-start gap-3", decisionInfo.bg)}>
            <DecisionIcon size={22} className={cn(decisionInfo.color, "shrink-0 mt-0.5")} />
            <div>
              <p className={cn("font-semibold text-sm", decisionInfo.color)}>{decisionInfo.label}</p>
              <p className="text-xs text-muted-foreground mt-1">{decisionInfo.description}</p>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Probabilidad de fraude</span>
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

          <button
            type="button"
            onClick={() => setShowDetails(!showDetails)}
            className="mt-4 flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors w-full"
          >
            {showDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            <span>Ver detalles de modelos</span>
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
                <span className="text-muted-foreground">Regresion Logistica</span>
                <span className="text-foreground font-mono">
                  {(fraudResult.model_scores.logistic_regression * 100).toFixed(2)}%
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">KMeans</span>
                <span className="text-foreground font-mono">
                  {(fraudResult.model_scores.kmeans_anomaly * 100).toFixed(2)}%
                </span>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={onNewTransaction}
            className={cn(
              "mt-5 w-full rounded-2xl px-4 py-3 text-sm font-semibold",
              "bg-white/5 border border-white/15 text-foreground",
              "backdrop-blur-md transition-all duration-300",
              "hover:bg-white/10 hover:border-white/25"
            )}
          >
            Nueva transaccion
          </button>
        </div>
      )}
    </div>
  );
}