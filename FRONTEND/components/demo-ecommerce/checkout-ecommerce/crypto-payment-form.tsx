"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, Bitcoin, Loader2, MapPin, ShieldCheck } from "lucide-react";
import { API_BASE_URL } from "@/lib/api";
import { cn, readHttpErrorMessage } from "@/lib/utils";
import { getDemoLibreriaRuntimeCheckoutContext } from "@/lib/demo-libreria-runtime-context";

interface Props {
  subtotal: number;
  apiKey: string;
  resetTrigger?: number;
  onResult?: (result: {
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

interface BCPaymentStatus {
  payment_id: number;
  status: "pending" | "confirming" | "confirmed" | "failed";
  status_reason?: string | null;
  tx_hash?: string | null;
  provider: string;
  provider_reference: string;
  confirmations: number;
  required_confirmations: number;
  fraud_result?: {
    transaction_id: number;
    fraud_probability: number;
    decision: string;
    model_scores: {
      random_forest: number;
      logistic_regression: number;
      kmeans_anomaly: number;
    };
    explanations?: unknown;
  } | null;
}

type CryptoInfo = {
  name: string;
  symbol: string;
  network: string;
  accent: string;
  color: string;
  gradient: string;
  icon: string;
};

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

const USE_TEST_SHIPPING_VALUES = true;

const TEST_SHIPPING_VALUES = {
  country: "Mexico",
  state: "Jalisco",
  city: "Guadalajara",
  postalCode: "45400",
  street: "Olimpica 345",
  reference: "CUCEI",
  fullName: "Luis Angel De La Cruz Ascencio",
  phone: "3334757609",
};

function defaultShippingValue(value: string): string {
  return USE_TEST_SHIPPING_VALUES ? value : "";
}

const CRYPTOS: CryptoInfo[] = [
  {
    name: "Bitcoin",
    symbol: "BTC",
    network: "Bitcoin",
    accent: "text-amber-400",
    color: "#F7931A",
    gradient: "from-orange-600/20 to-yellow-600/10",
    icon: "₿",
  },
  {
    name: "Ethereum",
    symbol: "ETH",
    network: "Ethereum",
    accent: "text-indigo-400",
    color: "#627EEA",
    gradient: "from-indigo-600/20 to-purple-600/10",
    icon: "Ξ",
  },
  {
    name: "BNB",
    symbol: "BNB",
    network: "BNB Chain",
    accent: "text-yellow-400",
    color: "#F3BA2F",
    gradient: "from-yellow-600/20 to-amber-600/10",
    icon: "◆",
  },
  {
    name: "Solana",
    symbol: "SOL",
    network: "Solana",
    accent: "text-cyan-400",
    color: "#9945FF",
    gradient: "from-purple-600/20 to-cyan-600/10",
    icon: "◎",
  },
  {
    name: "XRP",
    symbol: "XRP",
    network: "XRP Ledger",
    accent: "text-slate-300",
    color: "#23292F",
    gradient: "from-slate-600/20 to-blue-600/10",
    icon: "✕",
  },
];

const FINAL_STATUSES = new Set(["confirmed", "failed"]);
const POLL_INTERVAL_MS = 2000;

export default function DemoLibreriaCryptoPaymentForm({
  subtotal,
  apiKey,
  resetTrigger = 0,
  onResult,
}: Props) {
  const [selectedSymbol, setSelectedSymbol] = useState("BTC");
  const [walletAddress, setWalletAddress] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<BCPaymentStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [runtime, setRuntime] = useState<ReturnType<typeof getDemoLibreriaRuntimeCheckoutContext> | null>(null);
  const [shippingCountry, setShippingCountry] = useState(() => defaultShippingValue(TEST_SHIPPING_VALUES.country));
  const [shippingState, setShippingState] = useState(() => defaultShippingValue(TEST_SHIPPING_VALUES.state));
  const [shippingCity, setShippingCity] = useState(() => defaultShippingValue(TEST_SHIPPING_VALUES.city));
  const [shippingZip, setShippingZip] = useState(() => defaultShippingValue(TEST_SHIPPING_VALUES.postalCode));
  const [shippingStreet, setShippingStreet] = useState(() => defaultShippingValue(TEST_SHIPPING_VALUES.street));
  const [shippingReference, setShippingReference] = useState(() => defaultShippingValue(TEST_SHIPPING_VALUES.reference));
  const [shippingName, setShippingName] = useState(() => defaultShippingValue(TEST_SHIPPING_VALUES.fullName));
  const [shippingPhone, setShippingPhone] = useState(() => defaultShippingValue(TEST_SHIPPING_VALUES.phone));
  const pollTimerRef = useRef<number | null>(null);

  const selected = useMemo(
    () => CRYPTOS.find((crypto) => crypto.symbol === selectedSymbol) ?? CRYPTOS[0],
    [selectedSymbol]
  );
  const hasRequiredShippingFields = [
    shippingCountry,
    shippingState,
    shippingCity,
    shippingZip,
    shippingStreet,
    shippingName,
    shippingPhone,
  ].every((value) => value.trim().length > 0);

  const stopPolling = () => {
    if (pollTimerRef.current) {
      window.clearTimeout(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  };

  useEffect(() => {
    stopPolling();
    setSelectedSymbol("BTC");
    setWalletAddress("");
    setIsSubmitting(false);
    setPaymentStatus(null);
    setShippingCountry(defaultShippingValue(TEST_SHIPPING_VALUES.country));
    setShippingState(defaultShippingValue(TEST_SHIPPING_VALUES.state));
    setShippingCity(defaultShippingValue(TEST_SHIPPING_VALUES.city));
    setShippingZip(defaultShippingValue(TEST_SHIPPING_VALUES.postalCode));
    setShippingStreet(defaultShippingValue(TEST_SHIPPING_VALUES.street));
    setShippingReference(defaultShippingValue(TEST_SHIPPING_VALUES.reference));
    setShippingName(defaultShippingValue(TEST_SHIPPING_VALUES.fullName));
    setShippingPhone(defaultShippingValue(TEST_SHIPPING_VALUES.phone));
    setError(null);
  }, [resetTrigger]);

  useEffect(() => {
    setRuntime(getDemoLibreriaRuntimeCheckoutContext());
  }, [resetTrigger]);

  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, []);

  const scheduleStatusPoll = (paymentId: number) => {
    stopPolling();

    const poll = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/bc-transactions/${paymentId}`, {
          method: "GET",
          headers: { "X-API-Key": apiKey },
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error(await readHttpErrorMessage(response));
        }

        const status = (await response.json()) as BCPaymentStatus;
        setPaymentStatus(status);

        if (status.fraud_result && FINAL_STATUSES.has(status.status)) {
          onResult?.(status.fraud_result);
        }

        if (!FINAL_STATUSES.has(status.status)) {
          pollTimerRef.current = window.setTimeout(poll, POLL_INTERVAL_MS);
          return;
        }

        stopPolling();
      } catch (pollError: unknown) {
        setError(pollError instanceof Error ? pollError.message : "Error consultando estado blockchain");
        pollTimerRef.current = window.setTimeout(poll, POLL_INTERVAL_MS * 2);
      }
    };

    void poll();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    stopPolling();
    setError(null);
    setPaymentStatus(null);
    onResult?.(null);

    if (subtotal <= 0) {
      setError("El monto del pedido no es valido.");
      return;
    }

    if (!hasRequiredShippingFields) {
      setError("Completa la direccion de envio obligatoria.");
      return;
    }

    const runtimeNow = runtime ?? getDemoLibreriaRuntimeCheckoutContext();

    const payload = {
      user_id: runtimeNow.userId,
      amount: subtotal,
      merchant_category: runtimeNow.merchantCategory,
      country: runtimeNow.country,
      device_type: runtimeNow.deviceType,
      hour: runtimeNow.hour,
      day_of_week: runtimeNow.dayOfWeek,
      asset_symbol: selected.symbol,
      network: selected.network,
      wallet_address: walletAddress || undefined,
      shipping_country: shippingCountry,
      shipping_state: shippingState,
      shipping_city: shippingCity,
      shipping_postal_code: shippingZip,
      shipping_street: shippingStreet,
      shipping_reference: shippingReference,
      shipping_full_name: shippingName,
      shipping_phone: shippingPhone,
    };

    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_BASE_URL}/bc-transactions/simple`, {
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

      const created = (await response.json()) as BCPaymentStatus;
      setPaymentStatus(created);
      scheduleStatusPoll(created.payment_id);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "No se pudo crear el pago blockchain");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-foreground">Pago blockchain</h2>
        {/* <span className="text-xs rounded-full border border-white/10 bg-white/5 px-3 py-1 text-muted-foreground">
          Flujo realista
        </span> */}
      </div>

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
          <p className="text-muted-foreground">Categoria: <span className="text-foreground">{runtime?.merchantCategory ?? "retail"}</span></p>
          <p className="text-muted-foreground">Dispositivo: <span className="text-foreground">{runtime?.deviceType ?? "web"}</span></p>
          <p className="text-muted-foreground">Hora: <span className="text-foreground">{runtime ? `${String(runtime.hour).padStart(2, "0")}:00` : "—"}</span></p>
        </div>
      </div> */}

      <div className={cn("rounded-2xl border border-white/10 p-5 shadow-2xl bg-gradient-to-br", selected.gradient)}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/40">Wallet destino</p>
            <p className="mt-2 text-lg font-semibold text-white">{selected.name}</p>
            <p className="mt-1 text-xs text-white/60">Red: {selected.network}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm font-semibold text-white">
            {selected.symbol}
          </div>
        </div>

        <div className="mt-5 grid grid-cols-5 gap-3">
          {CRYPTOS.map((crypto) => {
            const active = crypto.symbol === selected.symbol;
            return (
              <button
                key={crypto.symbol}
                type="button"
                onClick={() => setSelectedSymbol(crypto.symbol)}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-2xl border px-2 py-4 text-center transition-all duration-300",
                  active
                    ? "border-white/20 bg-white/10 shadow-lg"
                    : "border-white/10 bg-white/5 hover:border-white/15 hover:bg-white/10"
                )}
                style={active ? { boxShadow: `0 0 30px ${crypto.color}20, 0 8px 20px rgba(0,0,0,0.3)` } : {}}
              >
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-xl text-lg font-bold transition-all duration-300",
                    `bg-gradient-to-br ${crypto.gradient}`,
                    active ? "scale-110 shadow-lg" : "scale-100"
                  )}
                  style={active ? { color: crypto.color, textShadow: `0 0 8px ${crypto.color}60` } : { color: `${crypto.color}80` }}
                >
                  {crypto.icon}
                </div>
                <span className={cn("text-xs font-semibold transition-colors duration-200", active ? "text-white" : "text-white/70")}>
                  {crypto.symbol}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 text-xs text-white/70">
          <div className="rounded-xl border border-white/10 bg-white/5 p-3">
            <p className="uppercase tracking-wider text-white/40">Monto</p>
            <p className="mt-1 text-base font-semibold text-white">${subtotal.toFixed(2)}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-3">
            <p className="uppercase tracking-wider text-white/40">Estado</p>
            <p className="mt-1 text-base font-semibold text-white">{paymentStatus?.status ?? "Preparado"}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        {CRYPTOS.map((crypto) => {
          const active = crypto.symbol === selected.symbol;
          return (
            <button
              key={crypto.symbol}
              type="button"
              onClick={() => setSelectedSymbol(crypto.symbol)}
              className={cn(
                "glass-crypto-card flex items-center justify-center gap-2 rounded-2xl px-3 py-3 text-sm transition-all duration-300",
                active ? "glass-crypto-active border-white/20 shadow-lg" : "border-white/5 hover:border-white/10"
              )}
              style={active ? { boxShadow: `0 0 24px ${crypto.color}20` } : {}}
            >
              <span className={cn("text-lg font-bold", active ? "text-foreground" : crypto.accent)}>
                {crypto.icon}
              </span>
              <span className={active ? "text-foreground font-semibold" : "text-muted-foreground"}>{crypto.symbol}</span>
            </button>
          );
        })}
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Monto</p>
          <p className="text-xl font-bold text-foreground">${subtotal.toFixed(2)}</p>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Red</p>
          <p className={cn("text-sm font-semibold", selected.accent)}>{selected.network}</p>
        </div>
      </div>

      <div>
        <label className="checkout-label">Direccion wallet (opcional)</label>
        <input
          value={walletAddress}
          onChange={(e) => setWalletAddress(e.target.value)}
          placeholder={`Wallet ${selected.symbol}`}
          className="checkout-input font-mono text-sm"
          disabled={isSubmitting}
        />
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 space-y-4">
        <div className="flex items-center gap-2">
          <MapPin size={16} className="text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Dirección de envío</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="checkout-label">País</label>
            <input
              value={shippingCountry}
              onChange={(e) => setShippingCountry(e.target.value)}
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
            <label className="checkout-label">Referencia</label>
            <input
              value={shippingReference}
              onChange={(e) => setShippingReference(e.target.value)}
              className="checkout-input"
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label className="checkout-label">Nombre completo</label>
            <input
              value={shippingName}
              onChange={(e) => setShippingName(e.target.value)}
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
        </div>

      </div>

      {paymentStatus && (
        <div className="rounded-xl border border-white/10 bg-black/20 p-3 text-xs text-muted-foreground space-y-1">
          <p>
            Payment ID: <span className="text-foreground">{paymentStatus.payment_id}</span>
          </p>
          <p>
            Estado: <span className="text-foreground">{paymentStatus.status}</span>
          </p>
          <p>
            Confirmaciones: <span className="text-foreground">{paymentStatus.confirmations}/{paymentStatus.required_confirmations}</span>
          </p>
        </div>
      )}

      {error && (
        <div className="glass-checkout-alert-error rounded-2xl p-4 flex items-center gap-3 animate-fade-in">
          <AlertTriangle size={18} className="text-red-400 shrink-0" />
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting || subtotal <= 0}
        className={cn(
          "checkout-button-primary w-full py-4 rounded-2xl text-base font-semibold",
          "flex items-center justify-center gap-2",
          "disabled:opacity-50 disabled:cursor-not-allowed"
        )}
      >
        {isSubmitting ? (
          <>
            <Loader2 size={18} className="animate-spin" /> Creando pago blockchain...
          </>
        ) : (
          <>
            <ShieldCheck size={18} /> Pagar con {selected.name}
          </>
        )}
      </button>

      {/* <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-2">
        <Bitcoin size={14} /> Hora, pais, categoria y dispositivo se adjuntan automaticamente al backend.
      </p> */}
    </form>
  );
}