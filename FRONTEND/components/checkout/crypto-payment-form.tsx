"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Bitcoin, Loader2, ShieldCheck, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { API_BASE_URL } from "@/lib/api";
import CustomSelect from "./custom-select";

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

interface Props {
  subtotal: number;
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

export default function CryptoPaymentForm({ subtotal, resetTrigger = 0, onResult }: Props) {
  const [selectedCrypto, setSelectedCrypto] = useState<string>("BTC");
  const [walletAddress, setWalletAddress] = useState("");
  const [userId, setUserId] = useState("1");
  const [merchantCategory, setMerchantCategory] = useState("crypto");
  const [country, setCountry] = useState("MX");
  const [deviceType, setDeviceType] = useState("desktop");
  const [selectedHour, setSelectedHour] = useState("");
  const [selectedDayOfWeek, setSelectedDayOfWeek] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selected = useMemo(
    () => CRYPTOS.find((crypto) => crypto.symbol === selectedCrypto) ?? CRYPTOS[0],
    [selectedCrypto]
  );

  useEffect(() => {
    setSelectedCrypto("BTC");
    setWalletAddress("");
    setUserId("1");
    setMerchantCategory("crypto");
    setCountry("MX");
    setDeviceType("desktop");
    setSelectedHour("");
    setSelectedDayOfWeek("");
    setIsSubmitting(false);
    setError(null);
  }, [resetTrigger]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
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

    setIsSubmitting(true);

    try {
      const payload = {
        user_id: parsedUserId,
        amount: subtotal,
        merchant_category: merchantCategory,
        country,
        device_type: deviceType,
        ...(selectedHour !== "" ? { hour: parseInt(selectedHour, 10) } : {}),
        ...(selectedDayOfWeek !== "" ? { day_of_week: parseInt(selectedDayOfWeek, 10) } : {}),
      };

      const response = await fetch(`${API_BASE_URL}/bc-transactions/simple`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": "libros_book",
        },
        body: JSON.stringify(payload),
        credentials: "include",
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({ detail: "Crypto transaction failed" }));
        throw new Error(errData.detail || "Crypto transaction failed");
      }

      const result = await response.json();
      onResult?.(result);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Crypto transaction failed");
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Pago Blockchain</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Prototipo visual de pago cripto para demo de interfaz.
          </p>
        </div>
        <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-muted-foreground flex items-center gap-2">
          <Bitcoin size={14} className="text-amber-400" />
          Blockchain Prototype
        </div>
      </div>

      <div className="glass-checkout-alert-info rounded-2xl p-4 flex items-start gap-3 animate-fade-in">
        <div className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0 mt-0.5">
          <span className="text-xs text-amber-300">i</span>
        </div>
        <div>
          <p className="text-sm text-amber-200 font-medium">Modo prototipo</p>
          <p className="text-xs text-amber-100/70 mt-1">
            Esta sección usa endpoint dedicado de blockchain y mantiene el flujo simple sin Coinbase Commerce por ahora.
          </p>
        </div>
      </div>

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
              Conectado a bc-transactions/simple
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

      {error && (
        <div className="glass-checkout-alert-error rounded-2xl p-4 flex items-center gap-3 animate-fade-in">
          <AlertTriangle size={18} className="text-red-400 shrink-0" />
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}

      <div className="rounded-lg border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
        Prototipo blockchain conectado al backend: usa el endpoint de transacción simple para correr análisis antifraude.
      </div>

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
            Analizando transacción...
          </>
        ) : (
          <>
            <ShieldCheck size={18} />
            Pagar con {selected.name} y analizar
          </>
        )}
      </button>
    </form>
  );
}
