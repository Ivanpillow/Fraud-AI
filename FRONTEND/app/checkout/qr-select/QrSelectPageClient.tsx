"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle2, ChevronLeft, CreditCard, Loader2, Sparkles, XCircle } from "lucide-react";
import { API_BASE_URL, createQrSession, fetchQrSessionStatus, updateQrSessionStatus } from "@/lib/api";
import { DEMO_QR_CARDS, type DemoQrCard } from "@/lib/qr-checkout";
import { readHttpErrorMessage } from "@/lib/utils";
import { navigateToFraudResult } from "@/lib/fraud-result-routing";
import { saveDemoLibreriaCart } from "@/lib/demo-libreria-cart";
import { loadDemoEcommerceCart, saveDemoEcommerceCart } from "@/lib/demo-ecommerce-cart";
import { isDemoEcommerceMerchantSlug } from "@/lib/demo-ecommerce-merchants";

function formatMoney(value: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 2,
  }).format(value);
}

function parseNumber(value: string | null): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function dayOfWeekToIso(value: number): number {
  const current = value % 7;
  return current === 0 ? 7 : current;
}

function getGeoFallback() {
  return {
    country: "MX",
    latitude: 19.4326,
    longitude: -99.1332,
  };
}

type QrCartItem = { id: string; qty: number };

function parseCartItems(raw: string | null): QrCartItem[] {
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as Array<{ id?: unknown; qty?: unknown }>;
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((item) => typeof item?.id === "string" && Number.isFinite(item?.qty))
      .map((item) => ({
        id: String(item.id),
        qty: Math.max(0, Math.floor(Number(item.qty))),
      }))
      .filter((item) => item.qty > 0);
  } catch {
    return [];
  }
}

function clearQrSessionStorage() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem("qr_session_api_key");
  window.sessionStorage.removeItem("qr_session_transaction_id");
}

export default function QrSelectPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const merchantSlug = searchParams.get("merchantSlug") ?? "";
  const merchantName = searchParams.get("merchantName") ?? "Pago QR";
  const merchantApiKey = searchParams.get("merchantApiKey") ?? "";
  const subtotal = parseNumber(searchParams.get("subtotal"));
  const returnUrl = searchParams.get("returnUrl") ?? "/checkout";
  const sharedTransactionId = parseNumber(searchParams.get("transactionId"));
  const cartItems = useMemo(() => parseCartItems(searchParams.get("cart")), [searchParams]);
  const shippingCountry = searchParams.get("shippingCountry") ?? undefined;
  const shippingState = searchParams.get("shippingState") ?? undefined;
  const shippingCity = searchParams.get("shippingCity") ?? undefined;
  const shippingPostalCode = searchParams.get("shippingPostalCode") ?? undefined;
  const shippingStreet = searchParams.get("shippingStreet") ?? undefined;
  const shippingReference = searchParams.get("shippingReference") ?? undefined;
  const shippingFullName = searchParams.get("shippingFullName") ?? undefined;
  const shippingPhone = searchParams.get("shippingPhone") ?? undefined;

  const [selectedCardNumber, setSelectedCardNumber] = useState<string>(DEMO_QR_CARDS[0].cardNumber);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    transaction_id: number;
    fraud_probability: number;
    decision: string;
    model_scores: {
      random_forest: number;
      logistic_regression: number;
      kmeans_anomaly: number;
    };
    explanations?: unknown;
  } | null>(null);
  const [sessionEndedState, setSessionEndedState] = useState<"cancelled" | "returned" | null>(null);

  const hasNavigatedRef = useRef(false);

  const selectedCard = useMemo<DemoQrCard | undefined>(
    () => DEMO_QR_CARDS.find((card) => card.cardNumber === selectedCardNumber) ?? DEMO_QR_CARDS[0],
    [selectedCardNumber]
  );

  const canSubmit = Boolean(merchantSlug && merchantApiKey && subtotal > 0 && selectedCard);

  const restoreCartForReturn = () => {
    if (cartItems.length === 0) return;

    const nextCart = Object.fromEntries(cartItems.map((item) => [item.id, item.qty]));
    const returnPath = new URL(returnUrl, window.location.origin).pathname;

    if (returnPath.startsWith("/demo-libreria")) {
      saveDemoLibreriaCart(nextCart);
      return;
    }

    if (returnPath.startsWith("/demo-ecommerce") && isDemoEcommerceMerchantSlug(merchantSlug)) {
      const current = loadDemoEcommerceCart();
      const updated = {
        ...current,
        [merchantSlug]: nextCart,
      };
      saveDemoEcommerceCart(updated);
    }
  };

  const handleBack = () => {
    hasNavigatedRef.current = true;
    if (merchantApiKey && sharedTransactionId > 0) {
      void updateQrSessionStatus(merchantApiKey, sharedTransactionId, "cancelled").catch(() => undefined);
    }
    restoreCartForReturn();
    clearQrSessionStorage();
    router.push(returnUrl);
  };

  useEffect(() => {
    if (!merchantApiKey || sharedTransactionId <= 0) return;

    if (typeof window !== "undefined") {
      window.sessionStorage.setItem("qr_session_api_key", merchantApiKey);
      window.sessionStorage.setItem("qr_session_transaction_id", String(sharedTransactionId));
    }

    void createQrSession(merchantApiKey, sharedTransactionId).catch(() => undefined);
  }, [merchantApiKey, sharedTransactionId]);

  useEffect(() => {
    if (!merchantApiKey || sharedTransactionId <= 0) return;

    const interval = window.setInterval(async () => {
      const res = await fetchQrSessionStatus(merchantApiKey, sharedTransactionId);
      if (hasNavigatedRef.current || !res.data) return;

      if (res.data.status === "cancelled" || res.data.status === "returned") {
        hasNavigatedRef.current = true;
        clearQrSessionStorage();
        setSessionEndedState(res.data.status);
      }
    }, 1500);

    return () => {
      window.clearInterval(interval);
    };
  }, [merchantApiKey, sharedTransactionId, returnUrl, cartItems, merchantSlug, router]);

  const handlePay = async () => {
    setError(null);
    setResult(null);

    if (!canSubmit) {
      setError("Falta contexto de pago o una tarjeta válida.");
      return;
    }

    setIsSubmitting(true);

    try {
      const fallback = getGeoFallback();
      const now = new Date();
      const payload = {
        ...(sharedTransactionId > 0 ? { transaction_id: sharedTransactionId } : {}),
        card_number: selectedCard?.cardNumber,
        amount: subtotal,
        country: fallback.country,
        latitude: fallback.latitude,
        longitude: fallback.longitude,
        device_change_flag: false,
        hour: now.getHours(),
        day_of_week: dayOfWeekToIso(now.getDay()),
        shipping_country: shippingCountry,
        shipping_state: shippingState,
        shipping_city: shippingCity,
        shipping_postal_code: shippingPostalCode,
        shipping_street: shippingStreet,
        shipping_reference: shippingReference,
        shipping_full_name: shippingFullName,
        shipping_phone: shippingPhone,
      };

      const response = await fetch(`${API_BASE_URL}/qr-transactions/simple`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": merchantApiKey,
        },
        body: JSON.stringify(payload),
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(await readHttpErrorMessage(response));
      }

      const data = await response.json();
      setResult(data);

      if (merchantApiKey && sharedTransactionId > 0) {
        void updateQrSessionStatus(merchantApiKey, sharedTransactionId, "completed").catch(() => undefined);
      }

      navigateToFraudResult(data, returnUrl);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "No se pudo procesar el pago QR");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-6 md:px-8 md:py-10">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-24 left-[-8rem] h-96 w-96 rounded-full bg-primary/15 blur-[120px]" />
        <div className="absolute top-1/3 right-[-8rem] h-[28rem] w-[28rem] rounded-full bg-cyan-500/15 blur-[140px]" />
        <div className="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-emerald-500/10 blur-[120px]" />
      </div>

      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 animate-fade-in">
        <section className="glass-card rounded-3xl p-6 md:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleBack}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-muted-foreground transition-all hover:bg-white/10 hover:text-foreground"
            >
              <ChevronLeft size={14} /> Volver
            </button>
            <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-muted-foreground">
              {merchantSlug || "checkout"}
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-2">
            <p className="text-xs uppercase tracking-[0.25em] text-primary/90">Selección de método de pago</p>
            <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              {merchantName}
            </h1>
            <p className="text-sm text-muted-foreground md:text-base">
              Escoge un método de pago para completar tu compra por {formatMoney(subtotal)}.
            </p>
          </div>
        </section>

        <section className="glass-card rounded-3xl p-6 md:p-8">
          {sessionEndedState ? (
            <div className="rounded-3xl border border-amber-500/30 bg-amber-500/10 p-6 md:p-8">
              <div className="flex items-center gap-3 text-amber-200">
                <XCircle size={22} />
                <h2 className="text-xl font-semibold">
                  {sessionEndedState === "cancelled" ? "Pago cancelado desde desktop" : "Regreso al carrito detectado"}
                </h2>
              </div>
              <p className="mt-3 text-sm text-amber-100/90">
                Esta sesión QR ya no está activa. Puedes cerrar esta pestaña o escanear el nuevo QR generado en tu computadora.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => router.push(returnUrl)}
                  className="rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-sm text-foreground transition-colors hover:bg-white/20"
                >
                  Volver al checkout
                </button>
              </div>
            </div>
          ) : (
          <>
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Total a pagar</p>
              <p className="mt-1 text-2xl font-bold text-foreground">{formatMoney(subtotal)}</p>
            </div>
            {/* <div className="flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/15 px-3 py-2 text-xs text-emerald-200">
              <ShieldCheck size={14} /> Flujo QR móvil
            </div> */}
          </div>

          <div className="mt-6 grid gap-3">
            {DEMO_QR_CARDS.map((card) => {
              const isSelected = selectedCardNumber === card.cardNumber;
              return (
                <button
                  key={card.cardNumber}
                  type="button"
                  onClick={() => setSelectedCardNumber(card.cardNumber)}
                  className={[
                    "rounded-3xl border p-4 text-left transition-all",
                    isSelected
                      ? "border-primary/60 bg-primary/15 shadow-lg shadow-primary/10"
                      : "border-white/10 bg-white/[0.03] hover:bg-white/5",
                  ].join(" ")}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] uppercase tracking-wide text-muted-foreground">
                        {card.label}
                      </div>
                      <h2 className="mt-3 text-lg font-semibold text-foreground">{card.displayNumber}</h2>
                      <p className="mt-1 text-sm text-muted-foreground">{card.description}</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-foreground">
                      <CreditCard size={18} />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-6 rounded-2xl border border-white/10 bg-black/10 p-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Tarjeta seleccionada</p>
            <p className="mt-1 text-sm font-semibold text-foreground">{selectedCard?.label}</p>
            <p className="text-xs text-muted-foreground">{selectedCard?.displayNumber}</p>
          </div>

          {error && (
            <div className="mt-5 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
              {error}
            </div>
          )}

          {result ? (
            <div className="mt-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4">
              <div className="flex items-center gap-2 text-emerald-200">
                <CheckCircle2 size={18} />
                <span className="font-semibold">Pago confirmado</span>
              </div>
              <p className="mt-2 text-sm text-emerald-100/90">
                Transacción {result.transaction_id} procesada con decisión {result.decision}.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => {
                    hasNavigatedRef.current = true;
                    if (merchantApiKey && sharedTransactionId > 0) {
                      void updateQrSessionStatus(merchantApiKey, sharedTransactionId, "returned").catch(() => undefined);
                    }
                    clearQrSessionStorage();
                    router.push(returnUrl);
                  }}
                  className="rounded-2xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  Volver a la tienda
                </button>
                <button
                  type="button"
                  onClick={() => setResult(null)}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground"
                >
                  Hacer otro pago
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={handlePay}
              disabled={!canSubmit || isSubmitting}
              className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-primary-foreground transition-all hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" /> Procesando pago...
                </>
              ) : (
                <>
                  <Sparkles size={18} /> Confirmar pago QR
                </>
              )}
            </button>
          )}
          </>
          )}
        </section>
      </div>
    </main>
  );
}
