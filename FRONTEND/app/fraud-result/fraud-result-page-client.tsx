"use client";


import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ShieldAlert, ShieldCheck, ShieldX, Sparkles } from "lucide-react";
import {
  clearPersistedFraudResult,
  parseFraudResultFromSearchParams,
  readPersistedFraudResult,
  type FraudResultPayload,
} from "@/lib/fraud-result-routing";
import { cn } from "@/lib/utils";
import { clearDemoLibreriaCart } from "@/lib/demo-libreria-cart";
import { clearDemoEcommerceMerchantCart } from "@/lib/demo-ecommerce-cart";
import { isDemoEcommerceMerchantSlug } from "@/lib/demo-ecommerce-merchants";
import { loadFraudAICheckoutContext } from "@/lib/fraudai-checkout-context";
import { loadDemoLibreriaCheckoutContext } from "@/lib/demo-libreria-checkout-context";
import { fetchQrSessionStatus, updateQrSessionStatus } from "@/lib/api";

function getDecisionMeta(decision: string) {
  switch (decision) {
    case "allow":
      return {
        icon: ShieldCheck,
        title: "Pago exitoso",
        subtitle: "La transacción fue aprobada.",
        accent: "text-emerald-300",
        ring: "border-emerald-500/25 bg-emerald-500/10",
      };
    case "review":
      return {
        icon: ShieldAlert,
        title: "Pago en revisión",
        subtitle: "La transacción requiere validación manual.",
        accent: "text-amber-300",
        ring: "border-amber-500/25 bg-amber-500/10",
      };
    case "block":
      return {
        icon: ShieldX,
        title: "Pago rechazado",
        subtitle: "La transacción fue bloqueada por riesgo.",
        accent: "text-red-300",
        ring: "border-red-500/25 bg-red-500/10",
      };
    default:
      return {
        icon: Sparkles,
        title: "Resultado disponible",
        subtitle: "No se pudo clasificar la decisión.",
        accent: "text-slate-300",
        ring: "border-white/10 bg-white/5",
      };
  }
}

function formatProbability(value: number | undefined): string {
  if (!value && value !== 0) return "—";
  const num = Number(value);
  if (!Number.isFinite(num)) return "—";
  // Ensure value is in 0-1 range, multiply by 100 for percentage
  const percentage = num > 1 ? num : num * 100;
  return `${percentage.toFixed(1)}%`;
}

function ScoreRow({ label, value }: { label: string; value: number | undefined }) {
  const displayValue = value !== undefined && Number.isFinite(value) 
    ? `${(value > 1 ? value : value * 100).toFixed(2)}%`
    : "—";
  
  return (
    <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="font-mono text-sm text-foreground">{displayValue}</span>
    </div>
  );
}

function resolveQrSessionApiKey(): string | null {
  if (typeof window === "undefined") return null;
  const stored = window.sessionStorage.getItem("qr_session_api_key");
  if (stored) return stored;

  const checkoutContext = loadFraudAICheckoutContext();
  if (checkoutContext?.merchant?.apiKey) return checkoutContext.merchant.apiKey;

  const libreriaContext = loadDemoLibreriaCheckoutContext();
  if (libreriaContext?.merchant?.apiKey) return libreriaContext.merchant.apiKey;

  return null;
}

function clearQrSessionStorage() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem("qr_session_api_key");
  window.sessionStorage.removeItem("qr_session_transaction_id");
}

function clearCartForBackUrl(backUrl: string) {
  if (typeof window === "undefined") return;
  const resolved = new URL(backUrl, window.location.origin);

  if (resolved.pathname.startsWith("/demo-libreria")) {
    clearDemoLibreriaCart();
    return;
  }

  if (resolved.pathname.startsWith("/demo-ecommerce")) {
    const merchantSlug = resolved.searchParams.get("merchant") ?? "";
    if (isDemoEcommerceMerchantSlug(merchantSlug)) {
      clearDemoEcommerceMerchantCart(merchantSlug);
    }
  }
}
export default function FraudResultPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [result, setResult] = useState<FraudResultPayload | null>(null);
  const hasNavigatedRef = useRef(false);

  const backUrl = searchParams.get("backUrl") || "/checkout";

  useEffect(() => {
    const stored = readPersistedFraudResult();
    const fromParams = parseFraudResultFromSearchParams(searchParams);
    
    // Prefer stored result from sessionStorage, fallback to URL params
    const finalResult = stored ?? fromParams ?? null;
    
    // Debug logging
    if (process.env.NODE_ENV === "development") {
      console.log("[FraudResult] Loaded result:", {
        fromSessionStorage: stored?.fraud_probability,
        fromSearchParams: fromParams?.fraud_probability,
        final: finalResult?.fraud_probability,
      });
    }
    
    setResult(finalResult);
  }, [searchParams]);

  const meta = useMemo(() => getDecisionMeta(result?.decision || ""), [result?.decision]);
  const DecisionIcon = meta.icon;

  useEffect(() => {
    return () => {
      clearPersistedFraudResult();
    };
  }, []);

  useEffect(() => {
    if (!result?.transaction_id) return;
    const apiKey = resolveQrSessionApiKey();
    if (!apiKey) return;

    const interval = window.setInterval(async () => {
      const res = await fetchQrSessionStatus(apiKey, result.transaction_id);
      if (hasNavigatedRef.current || !res.data) return;

      if (res.data.status === "returned") {
        hasNavigatedRef.current = true;
        clearCartForBackUrl(backUrl);
        clearQrSessionStorage();
        router.push(backUrl);
      }
    }, 1500);

    return () => {
      window.clearInterval(interval);
    };
  }, [result?.transaction_id, backUrl, router]);

  const handleReturn = () => {
    hasNavigatedRef.current = true;
    clearCartForBackUrl(backUrl);

    if (result?.transaction_id) {
      const apiKey = resolveQrSessionApiKey();
      if (apiKey) {
        void updateQrSessionStatus(apiKey, result.transaction_id, "returned").catch(() => undefined);
      }
    }

    clearQrSessionStorage();
    router.push(backUrl);
  };

  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-6 md:px-8 md:py-10 checkout-bg">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-24 left-[-8rem] h-96 w-96 rounded-full bg-primary/15 blur-[120px]" />
        <div className="absolute top-1/3 right-[-8rem] h-[28rem] w-[28rem] rounded-full bg-cyan-500/15 blur-[140px]" />
        <div className="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-emerald-500/10 blur-[120px]" />
      </div>

      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 animate-fade-in">
        <section className={cn("glass-card rounded-3xl p-6 md:p-8 border", meta.ring)}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-primary/90">Resultado antifraude</p>
              <h1 className={cn("mt-2 text-3xl font-bold tracking-tight md:text-4xl", meta.accent)}>
                {meta.title}
              </h1>
              <p className="mt-2 text-sm text-muted-foreground md:text-base">{meta.subtitle}</p>
            </div>
            <div className={cn("rounded-2xl border p-3", meta.ring)}>
              <DecisionIcon size={22} className={meta.accent} />
            </div>
          </div>
        </section>

        <section className="glass-card rounded-3xl p-6 md:p-8 space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Transacción</p>
              <p className="mt-1 text-lg font-semibold text-foreground">#{result?.transaction_id ?? "—"}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Probabilidad de fraude</p>
              <p className={cn("mt-1 text-lg font-semibold", meta.accent)}>
                {result ? formatProbability(result.fraud_probability) : "—"}
              </p>
            </div>
          </div>

          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground/70 mb-3">
              Predicción del modelo
            </h2>
            <div className="grid gap-3">
              <ScoreRow label="Random Forest" value={result?.model_scores.random_forest ?? 0} />
              <ScoreRow label="Logistic Regression" value={result?.model_scores.logistic_regression ?? 0} />
              <ScoreRow label="KMeans Anomaly" value={result?.model_scores.kmeans_anomaly ?? 0} />
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Estado final</p>
            <p className={cn("mt-1 text-base font-semibold", meta.accent)}>{meta.title}</p>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              type="button"
              onClick={handleReturn}
              className="inline-flex items-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90"
            >
              <ArrowLeft size={16} /> Regresar
            </button>
            {/* <button
              type="button"
              onClick={() => {
                clearPersistedFraudResult();
                router.push(backUrl);
              }}
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-muted-foreground transition-all hover:bg-white/10 hover:text-foreground"
            >
              Volver sin datos
            </button> */}
          </div>
        </section>
      </div>
    </main>
  );
}