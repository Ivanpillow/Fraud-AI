"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Bitcoin, Loader2, ShieldCheck, AlertTriangle, MapPin, QrCode } from "lucide-react";
import { cn, readHttpErrorMessage } from "@/lib/utils";
import { API_BASE_URL } from "@/lib/api";
import CustomSelect from "./custom-select";
import { buildBcPaymentUrl, buildQrImageUrl } from "@/lib/qr-checkout";

interface CryptoInfo {
  name: string;
  symbol: string;
  color: string;
  gradient: string;
  icon: string;
  network: string;
}

const CRYPTOS: CryptoInfo[] = [
  {
    name: "Bitcoin",
    symbol: "BTC",
    color: "#F7931A",
    gradient: "from-orange-600/20 to-yellow-600/10",
    icon: "₿",
    network: "Bitcoin",
  },
  {
    name: "Ethereum",
    symbol: "ETH",
    color: "#627EEA",
    gradient: "from-indigo-600/20 to-purple-600/10",
    icon: "Ξ",
    network: "Ethereum",
  },
  {
    name: "BNB",
    symbol: "BNB",
    color: "#F3BA2F",
    gradient: "from-yellow-600/20 to-amber-600/10",
    icon: "◆",
    network: "BNB Chain",
  },
  {
    name: "Solana",
    symbol: "SOL",
    color: "#9945FF",
    gradient: "from-purple-600/20 to-cyan-600/10",
    icon: "◎",
    network: "Solana",
  },
  {
    name: "XRP",
    symbol: "XRP",
    color: "#23292F",
    gradient: "from-slate-600/20 to-blue-600/10",
    icon: "✕",
    network: "XRP Ledger",
  },
];

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

const FINAL_STATUSES = new Set(["confirmed", "failed"]);
const POLL_INTERVAL_MS = 2000;

export default function CryptoPaymentForm({ subtotal, apiKey, resetTrigger = 0, onResult }: Props) {
  const [selectedCrypto, setSelectedCrypto] = useState<string>("BTC");
  const [walletAddress, setWalletAddress] = useState("");
  const [userId, setUserId] = useState("1");
  const [merchantCategory, setMerchantCategory] = useState("crypto");
  const [country, setCountry] = useState("MX");
  const [deviceType, setDeviceType] = useState("desktop");
  const [selectedHour, setSelectedHour] = useState("");
  const [selectedDayOfWeek, setSelectedDayOfWeek] = useState("");
  const [shippingCountry, setShippingCountry] = useState(() => defaultShippingValue(TEST_SHIPPING_VALUES.country));
  const [shippingState, setShippingState] = useState(() => defaultShippingValue(TEST_SHIPPING_VALUES.state));
  const [shippingCity, setShippingCity] = useState(() => defaultShippingValue(TEST_SHIPPING_VALUES.city));
  const [shippingZip, setShippingZip] = useState(() => defaultShippingValue(TEST_SHIPPING_VALUES.postalCode));
  const [shippingStreet, setShippingStreet] = useState(() => defaultShippingValue(TEST_SHIPPING_VALUES.street));
  const [shippingReference, setShippingReference] = useState(() => defaultShippingValue(TEST_SHIPPING_VALUES.reference));
  const [shippingName, setShippingName] = useState(() => defaultShippingValue(TEST_SHIPPING_VALUES.fullName));
  const [shippingPhone, setShippingPhone] = useState(() => defaultShippingValue(TEST_SHIPPING_VALUES.phone));
  const [paymentQrUrl, setPaymentQrUrl] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<BCPaymentStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pollTimerRef = useRef<number | null>(null);

  const selected = useMemo(
    () => CRYPTOS.find((crypto) => crypto.symbol === selectedCrypto) ?? CRYPTOS[0],
    [selectedCrypto]
  );

  const stopPolling = () => {
    if (pollTimerRef.current) {
      window.clearTimeout(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  };

  useEffect(() => {
    stopPolling();
    setSelectedCrypto("BTC");
    setWalletAddress("");
    setUserId("1");
    setMerchantCategory("crypto");
    setCountry("MX");
    setDeviceType("desktop");
    setSelectedHour("");
    setSelectedDayOfWeek("");
    setShippingCountry(defaultShippingValue(TEST_SHIPPING_VALUES.country));
    setShippingState(defaultShippingValue(TEST_SHIPPING_VALUES.state));
    setShippingCity(defaultShippingValue(TEST_SHIPPING_VALUES.city));
    setShippingZip(defaultShippingValue(TEST_SHIPPING_VALUES.postalCode));
    setShippingStreet(defaultShippingValue(TEST_SHIPPING_VALUES.street));
    setShippingReference(defaultShippingValue(TEST_SHIPPING_VALUES.reference));
    setShippingName(defaultShippingValue(TEST_SHIPPING_VALUES.fullName));
    setShippingPhone(defaultShippingValue(TEST_SHIPPING_VALUES.phone));
    setPaymentQrUrl("");
    setIsSubmitting(false);
    setPaymentStatus(null);
    setError(null);
  }, [resetTrigger]);

  useEffect(() => {
    return () => {
      if (pollTimerRef.current) {
        window.clearTimeout(pollTimerRef.current);
      }
    };
  }, []);

  const scheduleStatusPoll = (paymentId: number) => {
    stopPolling();

    const poll = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/bc-transactions/${paymentId}`, {
          method: "GET",
          headers: {
            "X-API-Key": apiKey,
          },
          credentials: "include",
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({ detail: "Unable to fetch blockchain status" }));
          throw new Error(errData.detail || "Unable to fetch blockchain status");
        }

        const statusPayload = (await response.json()) as BCPaymentStatus;
        setPaymentStatus(statusPayload);

        if (statusPayload.fraud_result && FINAL_STATUSES.has(statusPayload.status)) {
          onResult?.(statusPayload.fraud_result);
        }

        if (!FINAL_STATUSES.has(statusPayload.status)) {
          pollTimerRef.current = window.setTimeout(poll, POLL_INTERVAL_MS);
          return;
        }

        stopPolling();
      } catch (pollErr: unknown) {
        setError(pollErr instanceof Error ? pollErr.message : "Error consultando estado blockchain");
        pollTimerRef.current = window.setTimeout(poll, POLL_INTERVAL_MS * 2);
      }
    };

    void poll();
  };

  const merchantCategories = [
    { value: "crypto", label: "Cripto" },
    { value: "electronics", label: "Electrónica" },
    { value: "gaming", label: "Gaming" },
    { value: "travel", label: "Viajes" },
    { value: "retail", label: "Retail" },
  ];

  const countries = [
    { value: "MX", label: "México" },
    { value: "US", label: "Estados Unidos" },
    { value: "CA", label: "Canadá" },
    { value: "BR", label: "Brasil" },
    { value: "ES", label: "España" },
    { value: "FR", label: "Francia" },
  ];

  const dayOptions = [
    { value: "", label: "Automático" },
    { value: "1", label: "Lunes" },
    { value: "2", label: "Martes" },
    { value: "3", label: "Miércoles" },
    { value: "4", label: "Jueves" },
    { value: "5", label: "Viernes" },
    { value: "6", label: "Sábado" },
    { value: "7", label: "Domingo" },
  ];

  const hourOptions = [
    { value: "", label: "Automático" },
    ...Array.from({ length: 24 }, (_, hour) => ({
      value: String(hour),
      label: `${hour.toString().padStart(2, "0")}:00`,
    })),
  ];

  const hasRequiredShippingFields = [
    shippingCountry,
    shippingState,
    shippingCity,
    shippingZip,
    shippingStreet,
    shippingName,
    shippingPhone,
  ].every((value) => value.trim().length > 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    stopPolling();
    setError(null);
    setPaymentStatus(null);
    onResult?.(null);

    if (subtotal <= 0) {
      setError("Por favor ingrese un monto válido en el resumen del pedido");
      return;
    }

    const parsedUserId = parseInt(userId, 10);
    if (!Number.isFinite(parsedUserId) || parsedUserId <= 0) {
      setError("ID de usuario inválido");
      return;
    }

    if (!hasRequiredShippingFields) {
      setError("Completa la dirección de envío obligatoria.");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        user_id: parsedUserId,
        amount: subtotal,
        merchant_category: merchantCategory,
        country,
        device_type: deviceType,
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
        ...(selectedHour !== "" ? { hour: parseInt(selectedHour, 10) } : {}),
        ...(selectedDayOfWeek !== "" ? { day_of_week: parseInt(selectedDayOfWeek, 10) } : {}),
      };

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

      const result = await response.json();
      setPaymentStatus(result as BCPaymentStatus);
      setPaymentQrUrl(buildQrImageUrl(buildBcPaymentUrl((result as BCPaymentStatus).payment_id)));
      scheduleStatusPoll(result.payment_id as number);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Crypto transaction failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const statusLabel =
    paymentStatus?.status === "pending"
      ? "Pendiente de red"
      : paymentStatus?.status === "confirming"
      ? "Confirmando en blockchain"
      : paymentStatus?.status === "confirmed"
      ? "Confirmada"
      : paymentStatus?.status === "failed"
      ? "Fallida"
      : "Sin transacción activa";


  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Pago Blockchain</h2>
          {/* <p className="text-sm text-muted-foreground mt-1">
            Prototipo visual de pago cripto
          </p> */}
        </div>
        <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-muted-foreground flex items-center gap-2">
          <Bitcoin size={14} className="text-amber-400" />
          Blockchain
        </div>
      </div>

      {/* <div className="glass-checkout-alert-info rounded-2xl p-4 flex items-start gap-3 animate-fade-in">
        <div className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0 mt-0.5">
          <span className="text-xs text-amber-300">i</span>
        </div>
        <div>
          <p className="text-sm text-amber-200 font-medium">Modo prototipo</p>
          <p className="text-xs text-amber-100/70 mt-1">
            Esta sección usa endpoint dedicado de blockchain y mantiene el flujo simple sin Coinbase Commerce por ahora.
          </p>
        </div>
      </div> */}

      <div className="grid grid-cols-5 gap-3">
        {CRYPTOS.map((crypto) => {
          const isActive = selectedCrypto === crypto.symbol;
          return (
            <button
              key={crypto.symbol}
              type="button"
              onClick={() => setSelectedCrypto(crypto.symbol)}
              className={cn(
                "glass-crypto-card flex flex-col items-center gap-2 py-4 px-2 rounded-2xl transition-all duration-300",
                isActive ? "glass-crypto-active border-white/20 shadow-lg" : "border-white/5 hover:border-white/10"
              )}
              style={
                isActive
                  ? {
                      boxShadow: `0 0 30px ${crypto.color}20, 0 8px 20px rgba(0,0,0,0.3)`,
                    }
                  : {}
              }
            >
              <div
                className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold transition-all duration-300",
                  `bg-gradient-to-br ${crypto.gradient}`,
                  isActive ? "scale-110 shadow-lg" : "scale-100"
                )}
                style={
                  isActive
                    ? { color: crypto.color, textShadow: `0 0 8px ${crypto.color}60` }
                    : { color: `${crypto.color}80` }
                }
              >
                {crypto.icon}
              </div>
              <span className={cn("text-xs font-semibold transition-colors duration-200", isActive ? "text-foreground" : "text-muted-foreground")}>
                {crypto.symbol}
              </span>
            </button>
          );
        })}
      </div>

      <div className={cn("glass-checkout-card rounded-2xl p-5 bg-gradient-to-br", selected.gradient)}>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">A Pagar</p>
            <p className="text-2xl font-bold text-foreground mt-1">${subtotal.toFixed(2)}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Asset</p>
            <p className="text-2xl font-bold mt-1" style={{ color: selected.color }}>{selected.symbol}</p>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="rounded-xl border border-white/10 bg-black/10 p-3">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Red</p>
            <p className="text-sm text-foreground mt-1">{selected.network}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/10 p-3">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Estado</p>
            <p className="text-sm text-foreground mt-1 break-all">
              {statusLabel}
            </p>
          </div>
        </div>
        
      </div>

      <div>
        <label className="checkout-label">Dirección de billetera (demo)</label>
        <input
          type="text"
          value={walletAddress}
          onChange={(e) => setWalletAddress(e.target.value)}
          placeholder={`Ingrese su dirección de wallet ${selected.symbol}`}
          className="checkout-input font-mono text-sm"
          disabled={isSubmitting}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="checkout-label">ID de Usuario</label>
          <input
            type="number"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="1"
            className="checkout-input placeholder:text-muted-foreground/40"
            min="1"
            disabled={isSubmitting}
          />
        </div>
        <div>
          <label className="checkout-label">Tipo de Dispositivo</label>
          <CustomSelect
            value={deviceType}
            onChange={setDeviceType}
            options={[
              { value: "desktop", label: "Ordenador" },
              { value: "mobile", label: "Dispositivo Móvil" },
            ]}
            disabled={isSubmitting}
          />
        </div>
        <div>
          <label className="checkout-label">Categoría</label>
          <CustomSelect
            value={merchantCategory}
            onChange={setMerchantCategory}
            options={merchantCategories}
            disabled={isSubmitting}
          />
        </div>
        <div>
          <label className="checkout-label">País</label>
          <CustomSelect value={country} onChange={setCountry} options={countries} disabled={isSubmitting} />
        </div>
        <div>
          <label className="checkout-label">Día de la Semana (opcional)</label>
          <CustomSelect
            value={selectedDayOfWeek}
            onChange={setSelectedDayOfWeek}
            options={dayOptions}
            disabled={isSubmitting}
          />
        </div>
        <div>
          <label className="checkout-label">Hora del Día (opcional)</label>
          <CustomSelect value={selectedHour} onChange={setSelectedHour} options={hourOptions} disabled={isSubmitting} />
        </div>
      </div>


      {/* <div className="rounded-lg border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
        Flujo blockchain simulado profesional: crea pago pendiente, pasa por confirming y finaliza por webhook interno.
      </div> */}


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
              placeholder="Mexico"
              className="checkout-input"
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label className="checkout-label">Estado</label>
            <input
              value={shippingState}
              onChange={(e) => setShippingState(e.target.value)}
              placeholder="Jalisco"
              className="checkout-input"
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label className="checkout-label">Ciudad</label>
            <input
              value={shippingCity}
              onChange={(e) => setShippingCity(e.target.value)}
              placeholder="Guadalajara"
              className="checkout-input"
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label className="checkout-label">Código postal</label>
            <input
              value={shippingZip}
              onChange={(e) => setShippingZip(e.target.value)}
              placeholder="44100"
              className="checkout-input"
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label className="checkout-label">Calle y número</label>
            <input
              value={shippingStreet}
              onChange={(e) => setShippingStreet(e.target.value)}
              placeholder="Av. Vallarta 1234"
              className="checkout-input"
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label className="checkout-label">Referencia</label>
            <input
              value={shippingReference}
              onChange={(e) => setShippingReference(e.target.value)}
              placeholder="CUCEI"
              className="checkout-input"
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label className="checkout-label">Nombre completo</label>
            <input
              value={shippingName}
              onChange={(e) => setShippingName(e.target.value)}
              placeholder="Juan Pérez García"
              className="checkout-input"
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label className="checkout-label">Teléfono</label>
            <input
              value={shippingPhone}
              onChange={(e) => setShippingPhone(e.target.value)}
              placeholder="3334757609"
              className="checkout-input"
              disabled={isSubmitting}
            />
          </div>
        </div>
      </div>

      {paymentStatus && (
        <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-3 text-xs text-muted-foreground space-y-1">
          <p>
            Payment ID: <span className="text-foreground">{paymentStatus.payment_id}</span>
          </p>
          <p>
            Confirmaciones: <span className="text-foreground">{paymentStatus.confirmations}/{paymentStatus.required_confirmations}</span>
          </p>
          <p>
            Provider ref: <span className="text-foreground break-all">{paymentStatus.provider_reference}</span>
          </p>
          {paymentStatus.tx_hash && (
            <p>
              Tx hash: <span className="text-foreground break-all">{paymentStatus.tx_hash}</span>
            </p>
          )}
        </div>
      )}

      
      {paymentQrUrl && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 space-y-4">
          <div className="flex items-center gap-2">
            <QrCode size={16} className="text-primary" />
            <h3 className="text-sm font-semibold text-foreground">QR de pago</h3>
          </div>
          <div className="flex flex-col items-center gap-3">
            <img
              src={paymentQrUrl}
              alt="Código QR del pago cripto"
              className="h-44 w-44 rounded-2xl bg-white p-2 shadow-2xl shadow-black/30"
            />
            <p className="text-xs text-muted-foreground text-center max-w-md">
              Escanea este QR desde el celular para abrir la pantalla de confirmación. El QR sólo contiene el identificador del pago.
            </p>
          </div>
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
          "disabled:opacity-40 disabled:cursor-not-allowed"
        )}
      >
        {isSubmitting ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            Creando pago blockchain...
          </>
        ) : (
          <>
            <ShieldCheck size={18} />
            Generar QR
          </>
        )}
      </button>
    </form>
  );
}
