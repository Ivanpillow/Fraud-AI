"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, CreditCard, Loader2, MapPin, ShieldCheck } from "lucide-react";
import { API_BASE_URL } from "@/lib/api";
import { cn, readHttpErrorMessage } from "@/lib/utils";
import { getDemoLibreriaRuntimeCheckoutContext } from "@/lib/demo-libreria-runtime-context";

type CardBrand = "visa" | "mastercard" | "amex" | "discover" | "unknown";

type DemoRuntimeState = {
  country: string;
  deviceType: "mobile" | "web";
  hour: number;
  dayOfWeek: number;
  merchantCategory: string;
};

interface Props {
  amount: number;
  apiKey: string;
  resetTrigger?: number;
  onResult: (result: {
    transaction_id: number;
    fraud_probability: number;
    decision: string;
    model_scores: {
      random_forest: number;
      logistic_regression: number;
      kmeans_anomaly: number;
    };
    explanations?: unknown;
  } | null) => void;
}

function detectCardBrand(number: string): CardBrand {
  const digits = number.replace(/\D/g, "");
  if (/^4/.test(digits)) return "visa";
  if (/^(5[1-5]|2[2-7])/.test(digits)) return "mastercard";
  if (/^3[47]/.test(digits)) return "amex";
  if (/^(6011|65|64[4-9])/.test(digits)) return "discover";
  return "unknown";
}

function formatCardNumber(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 19);
  return digits.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
}

function formatExpiry(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length > 2) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return digits;
}

function isExpiryValid(expiry: string): boolean {
  if (!expiry.includes("/")) return false;

  const [monthStr, yearStr] = expiry.split("/");
  const month = parseInt(monthStr, 10);
  const year = parseInt(`20${yearStr}`, 10);

  if (!Number.isFinite(month) || !Number.isFinite(year)) return false;
  if (month < 1 || month > 12) return false;

  const now = new Date();
  const expiryDate = new Date(year, month);
  return expiryDate > now;
}

function formatDayOfWeek(dayOfWeek: number): string {
  return ["", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"][dayOfWeek] ?? "";
}

function formatRuntimeDate(dayOfWeek: number, hour: number): string {
  const now = new Date();
  const date = new Date(now);
  const currentDay = now.getDay() === 0 ? 7 : now.getDay();
  const diff = dayOfWeek - currentDay;
  date.setDate(now.getDate() + diff);
  date.setHours(hour, 0, 0, 0);

  return new Intl.DateTimeFormat("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export default function DemoLibreriaCardPaymentForm({
  amount,
  apiKey,
  resetTrigger = 0,
  onResult,
}: Props) {
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [runtime, setRuntime] = useState<DemoRuntimeState | null>(null);
  const [brandFlip, setBrandFlip] = useState(false);
  const [shippingName, setShippingName] = useState("");
  const [shippingStreet, setShippingStreet] = useState("");
  const [shippingCity, setShippingCity] = useState("");
  const [shippingState, setShippingState] = useState("");
  const [shippingZip, setShippingZip] = useState("");
  const [shippingPhone, setShippingPhone] = useState("");
  const [shippingReference, setShippingReference] = useState("");
  const cardRef = useRef<HTMLDivElement>(null);

  const brand = useMemo(() => detectCardBrand(cardNumber), [cardNumber]);

  useEffect(() => {
    setRuntime(getDemoLibreriaRuntimeCheckoutContext());
  }, [resetTrigger]);

  useEffect(() => {
    setBrandFlip(true);
    const timer = window.setTimeout(() => setBrandFlip(false), 180);
    return () => window.clearTimeout(timer);
  }, [brand]);

  useEffect(() => {
    setCardNumber("");
    setCardName("");
    setExpiry("");
    setCvv("");
    setShippingName("");
    setShippingStreet("");
    setShippingCity("");
    setShippingState("");
    setShippingZip("");
    setShippingPhone("");
    setShippingReference("");
    setError(null);
  }, [resetTrigger]);

  const runtimeDisplay = runtime;
  const hasRequiredShippingFields = [
    shippingName,
    shippingStreet,
    shippingCity,
    shippingState,
    shippingZip,
    shippingPhone,
  ].every((value) => value.trim().length > 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    onResult(null);

    if (!cardNumber || !cardName || !expiry || !cvv) {
      setError("Completa los datos de la tarjeta.");
      return;
    }

    if (amount <= 0) {
      setError("El monto del pedido no es valido.");
      return;
    }

    const digits = cardNumber.replace(/\D/g, "");
    if (digits.length < 13 || digits.length > 19) {
      setError("Numero de tarjeta invalido.");
      return;
    }

    if (!isExpiryValid(expiry)) {
      setError("Fecha de expiracion invalida.");
      return;
    }

    if (!hasRequiredShippingFields) {
      setError("Completa la direccion de envio obligatoria.");
      return;
    }

    const runtimeNow = runtime ?? getDemoLibreriaRuntimeCheckoutContext();

    const payload = {
      card_number: digits,
      amount,
      merchant_category: runtimeNow.merchantCategory,
      country: runtimeNow.country,
      device_type: runtimeNow.deviceType,
      hour: runtimeNow.hour,
      day_of_week: runtimeNow.dayOfWeek,
    };

    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_BASE_URL}/transactions/simple`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": apiKey,
        },
        body: JSON.stringify(payload),
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(await readHttpErrorMessage(response));
      }

      const result = await response.json();
      onResult(result);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "No se pudo procesar el pago");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <h2 className="text-lg font-semibold text-foreground">Pago con tarjeta</h2>

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Contexto automatico antifraude</p>
            <p className="text-sm text-foreground mt-1">
              {runtimeDisplay
                ? `${formatDayOfWeek(runtimeDisplay.dayOfWeek)} ${formatRuntimeDate(runtimeDisplay.dayOfWeek, runtimeDisplay.hour)}`
                : "Cargando contexto real..."}
            </p>
          </div>
          <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-muted-foreground">
            {runtimeDisplay?.country ?? "MX"}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <p className="text-muted-foreground">Dispositivo: <span className="text-foreground">{runtimeDisplay?.deviceType ?? "web"}</span></p>
          <p className="text-muted-foreground">Categoria: <span className="text-foreground">{runtimeDisplay?.merchantCategory ?? "retail"}</span></p>
          <p className="text-muted-foreground">Hora: <span className="text-foreground">{runtimeDisplay ? `${String(runtimeDisplay.hour).padStart(2, "0")}:00` : "—"}</span></p>
          <p className="text-muted-foreground">Dia: <span className="text-foreground">{runtimeDisplay ? formatDayOfWeek(runtimeDisplay.dayOfWeek) : "—"}</span></p>
        </div>
      </div>

      <div
        ref={cardRef}
        className={cn(
          "relative w-full max-w-[380px] mx-auto aspect-[1.586/1] rounded-3xl p-6 flex flex-col justify-between",
          "bg-gradient-to-br shadow-2xl transition-all duration-700 ease-out",
          brand === "visa"
            ? "from-blue-900 via-blue-800 to-blue-600"
            : brand === "mastercard"
            ? "from-red-900 via-orange-800 to-yellow-600"
            : brand === "amex"
            ? "from-cyan-900 via-teal-800 to-emerald-600"
            : brand === "discover"
            ? "from-orange-900 via-orange-700 to-amber-500"
            : "from-zinc-800 via-zinc-700 to-zinc-600",
          brandFlip && "scale-[1.01]"
        )}
      >
        <div className="absolute inset-0 rounded-3xl bg-white/5 backdrop-blur-sm border border-white/10" />
        <div className="relative z-10 flex justify-between items-start">
          <div className="w-12 h-9 rounded-lg bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-600 border border-yellow-200/30 shadow-inner" />
          <div className="flex items-center justify-center w-16 h-10 rounded-lg font-semibold text-white text-xs tracking-widest bg-white/10 border border-white/20">
            {brand === "visa" ? "VISA" : brand === "mastercard" ? "MC" : brand === "amex" ? "AMEX" : brand === "discover" ? "DISC" : "••••"}
          </div>
        </div>
        <div className="relative z-10 mt-auto space-y-3">
          <p className="text-white/90 text-lg md:text-xl font-mono tracking-[0.2em]">
            {cardNumber ? formatCardNumber(cardNumber) : "•••• •••• •••• ••••"}
          </p>
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-white/45">Titular</p>
              <p className="text-white text-sm md:text-base font-semibold truncate max-w-[220px]">
                {cardName || "NOMBRE APELLIDO"}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-[0.3em] text-white/45">Expira</p>
              <p className="text-white text-sm md:text-base font-semibold">{expiry || "MM/AA"}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="checkout-label">Numero de tarjeta</label>
          <input
            value={cardNumber}
            onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
            placeholder="1234 5678 9012 3456"
            inputMode="numeric"
            className="checkout-input"
            disabled={isSubmitting}
          />
        </div>

        <div className="md:col-span-2">
          <label className="checkout-label">Nombre del titular</label>
          <input
            value={cardName}
            onChange={(e) => setCardName(e.target.value.toUpperCase())}
            placeholder="NOMBRE APELLIDO"
            className="checkout-input"
            disabled={isSubmitting}
          />
        </div>

        <div>
          <label className="checkout-label">Expiracion</label>
          <input
            value={expiry}
            onChange={(e) => setExpiry(formatExpiry(e.target.value))}
            placeholder="MM/AA"
            inputMode="numeric"
            className="checkout-input"
            disabled={isSubmitting}
          />
        </div>

        <div>
          <label className="checkout-label">CVV</label>
          <input
            value={cvv}
            onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, brand === "amex" ? 4 : 3))}
            placeholder={brand === "amex" ? "1234" : "123"}
            inputMode="numeric"
            className="checkout-input"
            disabled={isSubmitting}
          />
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 space-y-4">
        <div className="flex items-center gap-2">
          <MapPin size={16} className="text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Dirección de envío</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="checkout-label">Nombre completo</label>
            <input
              value={shippingName}
              onChange={(e) => setShippingName(e.target.value)}
              className="checkout-input"
              disabled={isSubmitting}
              required
            />
          </div>

          <div className="md:col-span-2">
            <label className="checkout-label">Calle y numero</label>
            <input
              value={shippingStreet}
              onChange={(e) => setShippingStreet(e.target.value)}
              className="checkout-input"
              disabled={isSubmitting}
              required
            />
          </div>

          <div>
            <label className="checkout-label">Ciudad</label>
            <input
              value={shippingCity}
              onChange={(e) => setShippingCity(e.target.value)}
              className="checkout-input"
              disabled={isSubmitting}
              required
            />
          </div>

          <div>
            <label className="checkout-label">Estado</label>
            <input
              value={shippingState}
              onChange={(e) => setShippingState(e.target.value)}
              className="checkout-input"
              disabled={isSubmitting}
              required
            />
          </div>

          <div>
            <label className="checkout-label">Codigo postal</label>
            <input
              value={shippingZip}
              onChange={(e) => setShippingZip(e.target.value)}
              className="checkout-input"
              disabled={isSubmitting}
              required
            />
          </div>

          <div>
            <label className="checkout-label">Telefono</label>
            <input
              value={shippingPhone}
              onChange={(e) => setShippingPhone(e.target.value)}
              className="checkout-input"
              disabled={isSubmitting}
              required
            />
          </div>

          <div className="md:col-span-2">
            <label className="checkout-label">Referencia (opcional)</label>
            <input
              value={shippingReference}
              onChange={(e) => setShippingReference(e.target.value)}
              className="checkout-input"
              disabled={isSubmitting}
            />
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          Estos datos son solo visuales para la demo de ecommerce y no se envian al backend antifraude.
        </p>
      </div>

      {error && (
        <div className="glass-checkout-alert-error rounded-2xl p-4 flex items-center gap-3 animate-fade-in">
          <AlertTriangle size={18} className="text-red-400 shrink-0" />
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting || amount <= 0}
        className={cn(
          "checkout-button-primary w-full py-4 rounded-2xl text-base font-semibold",
          "flex items-center justify-center gap-2",
          "disabled:opacity-50 disabled:cursor-not-allowed"
        )}
      >
        {isSubmitting ? (
          <>
            <Loader2 size={18} className="animate-spin" /> Procesando pago...
          </>
        ) : (
          <>
            <ShieldCheck size={18} /> Pagar ${amount.toFixed(2)}
          </>
        )}
      </button>

      <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-2">
        <CreditCard size={14} /> El checkout toma hora, pais, categoria y dispositivo automaticamente.
      </p>
    </form>
  );
}
