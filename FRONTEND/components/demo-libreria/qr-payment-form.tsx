"use client";

import React, { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Loader2, MapPin, QrCode, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { loadDemoLibreriaCheckoutContext } from "@/lib/demo-libreria-checkout-context";
import { getDemoLibreriaRuntimeCheckoutContext } from "@/lib/demo-libreria-runtime-context";
import { buildQrImageUrl, buildQrSelectionUrl } from "@/lib/qr-checkout";

interface Props {
  subtotal: number;
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

function buildQrPattern(seed: number): boolean[] {
  return Array.from({ length: 81 }, (_, i) => {
    const row = Math.floor(i / 9);
    const col = i % 9;
    const inMarker = (row <= 2 && col <= 2) || (row <= 2 && col >= 6) || (row >= 6 && col <= 2);
    if (inMarker) return true;
    const n = Math.abs(Math.sin(seed * 0.001 + i * 17.123) * 43758.5453);
    return n - Math.floor(n) > 0.55;
  });
}

function dayLabel(dayOfWeek: number): string {
  return ["", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"][dayOfWeek] ?? "";
}

function formatDisplayDate(dayOfWeek: number, hour: number): string {
  const now = new Date();
  const currentDay = now.getDay() === 0 ? 7 : now.getDay();
  const date = new Date(now);
  date.setDate(now.getDate() + (dayOfWeek - currentDay));
  date.setHours(hour, 0, 0, 0);

  return new Intl.DateTimeFormat("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export default function DemoLibreriaQRPaymentForm({ subtotal, apiKey, resetTrigger = 0, onResult }: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [qrSeed, setQrSeed] = useState<number | null>(null);
  const [runtime, setRuntime] = useState<ReturnType<typeof getDemoLibreriaRuntimeCheckoutContext> | null>(null);
  const [checkoutContext, setCheckoutContext] = useState<ReturnType<typeof loadDemoLibreriaCheckoutContext> | null>(null);
  const [shippingName, setShippingName] = useState("");
  const [shippingStreet, setShippingStreet] = useState("");
  const [shippingCity, setShippingCity] = useState("");
  const [shippingState, setShippingState] = useState("");
  const [shippingZip, setShippingZip] = useState("");
  const [shippingPhone, setShippingPhone] = useState("");
  const [shippingReference, setShippingReference] = useState("");

  const qrSelectionUrl = useMemo(() => {
    if (!checkoutContext || subtotal <= 0) return "";

    return buildQrSelectionUrl({
      merchantSlug: checkoutContext.merchant.slug,
      merchantName: checkoutContext.merchant.name,
      merchantApiKey: checkoutContext.merchant.apiKey,
      subtotal,
      returnUrl: checkoutContext.returnUrl ?? "/demo-libreria/checkout",
    });
  }, [checkoutContext, subtotal]);

  const qrImageUrl = useMemo(() => (qrSelectionUrl ? buildQrImageUrl(qrSelectionUrl) : ""), [qrSelectionUrl]);
  const hasRequiredShippingFields = [
    shippingName,
    shippingStreet,
    shippingCity,
    shippingState,
    shippingZip,
    shippingPhone,
  ].every((value) => value.trim().length > 0);

  useEffect(() => {
    setRuntime(getDemoLibreriaRuntimeCheckoutContext());
    setCheckoutContext(loadDemoLibreriaCheckoutContext());
  }, [resetTrigger]);

  useEffect(() => {
    setShippingName("");
    setShippingStreet("");
    setShippingCity("");
    setShippingState("");
    setShippingZip("");
    setShippingPhone("");
    setShippingReference("");
  }, [resetTrigger]);

  const handleGenerateQR = () => {
    if (subtotal <= 0) {
      setError("El monto del pedido no es valido.");
      return;
    }

    if (!qrSelectionUrl) {
      setError("No se encontró el contexto del comercio para abrir el pago QR.");
      return;
    }

    setError(null);
    setQrSeed(Date.now());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    onResult(null);

    if (!qrSelectionUrl) {
      setError("No se encontró la página de pago QR.");
      return;
    }

    window.location.href = qrSelectionUrl;
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <h2 className="text-lg font-semibold text-foreground">Pago con QR</h2>

      {/* <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Contexto automatico antifraude</p>
            <p className="text-sm text-foreground mt-1">
              {runtime
                ? `${dayLabel(runtime.dayOfWeek)} ${formatDisplayDate(runtime.dayOfWeek, runtime.hour)}`
                : "Cargando contexto real..."}
            </p>
          </div>
          <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-muted-foreground">
            {runtime?.country ?? "MX"}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <p className="text-muted-foreground">Usuario: <span className="text-foreground">{runtime ? `#${runtime.userId}` : "—"}</span></p>
          <p className="text-muted-foreground">Dispositivo: <span className="text-foreground">{runtime?.deviceType ?? "web"}</span></p>
          <p className="text-muted-foreground">Coordenadas: <span className="text-foreground">{runtime ? `${runtime.latitude.toFixed(4)}, ${runtime.longitude.toFixed(4)}` : "—"}</span></p>
          <p className="text-muted-foreground">Cambio dispositivo: <span className="text-foreground">{runtime ? (runtime.deviceChangeFlag ? "Si" : "No") : "—"}</span></p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/10 p-3 text-xs text-muted-foreground flex items-center justify-between gap-3">
          <span>Categoria: <span className="text-foreground">{runtime?.merchantCategory ?? "retail"}</span></span>
          <span>Hora: <span className="text-foreground">{runtime ? `${String(runtime.hour).padStart(2, "0")}:00` : "—"}</span></span>
        </div>
      </div> */}

      <div className="flex flex-col items-center gap-4">
        <div
          className={cn(
            "glass-qr-container w-52 h-52 rounded-3xl flex items-center justify-center transition-all duration-500",
            qrSeed !== null && "glass-qr-active"
          )}
        >
          {qrSeed !== null && qrImageUrl ? (
            <div className="relative">
              <img
                src={qrImageUrl}
                alt="Código QR para abrir la selección de tarjeta"
                className="h-40 w-40 rounded-2xl bg-white p-2 shadow-2xl shadow-black/30"
              />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-8 h-8 rounded-lg bg-primary/80 flex items-center justify-center">
                  <QrCode size={16} className="text-primary-foreground" />
                </div>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleGenerateQR}
              disabled={isSubmitting}
              className="flex flex-col items-center gap-3 text-muted-foreground hover:text-foreground transition-colors"
            >
              <QrCode size={48} className="opacity-40" />
              <span className="text-sm font-medium">Generar codigo QR</span>
            </button>
          )}
        </div>

        {qrSeed !== null && qrImageUrl && (
          <p className="text-xs text-muted-foreground animate-fade-in">
            Escanea el código QR con tu teléfono para elegir tarjeta y completar el pago.
          </p>
        )}
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

      </div>

      {error && (
        <div className="glass-checkout-alert-error rounded-2xl p-4 flex items-center gap-3 animate-fade-in">
          <AlertTriangle size={18} className="text-red-400 shrink-0" />
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}

      {/* {qrSeed !== null && (
        <div className="rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200">
          El código QR ahora abre la página móvil para seleccionar tarjeta y pagar.
        </div>
      )} */}

      <button
        type="submit"
        disabled={isSubmitting || subtotal <= 0 || !qrSelectionUrl}
        className={cn(
          "checkout-button-primary w-full py-4 rounded-2xl text-base font-semibold",
          "flex items-center justify-center gap-2",
          "disabled:opacity-50 disabled:cursor-not-allowed"
        )}
      >
        {isSubmitting ? (
          <>
            <Loader2 size={18} className="animate-spin" /> Abrir página QR...
          </>
        ) : (
          <>
            <ShieldCheck size={18} /> Abrir página de pago QR
          </>
        )}
      </button>
    </form>
  );
}
