"use client";

import React, { useEffect, useMemo, useState } from "react";
import { QrCode, Loader2, AlertTriangle, ShieldCheck, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { API_BASE_URL } from "@/lib/api";
import CustomSelect from "./custom-select";

interface Props {
  subtotal: number;
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

type CountryOption = {
  value: string;
  label: string;
  defaultLat: string;
  defaultLon: string;
};

const COUNTRIES: CountryOption[] = [
  { value: "MX", label: "México", defaultLat: "19.4326", defaultLon: "-99.1332" },
  { value: "US", label: "Estados Unidos", defaultLat: "38.9072", defaultLon: "-77.0369" },
  { value: "CA", label: "Canadá", defaultLat: "45.4215", defaultLon: "-75.6972" },
  { value: "GB", label: "Reino Unido", defaultLat: "51.5074", defaultLon: "-0.1278" },
  { value: "DE", label: "Alemania", defaultLat: "52.5200", defaultLon: "13.4050" },
  { value: "JP", label: "Japón", defaultLat: "35.6762", defaultLon: "139.6503" },
  { value: "BR", label: "Brasil", defaultLat: "-15.7939", defaultLon: "-47.8828" },
  { value: "IN", label: "India", defaultLat: "28.6139", defaultLon: "77.2090" },
];

function buildStableQrPattern(seed: number): boolean[] {
  return Array.from({ length: 81 }, (_, i) => {
    const row = Math.floor(i / 9);
    const col = i % 9;
    const inTopLeft = row <= 2 && col <= 2;
    const inTopRight = row <= 2 && col >= 6;
    const inBottomLeft = row >= 6 && col <= 2;
    if (inTopLeft || inTopRight || inBottomLeft) {
      return true;
    }

    const mixed = Math.abs(Math.sin(seed * 0.001 + i * 12.9898) * 43758.5453);
    return (mixed - Math.floor(mixed)) > 0.56;
  });
}

export default function QRPaymentForm({ subtotal, resetTrigger = 0, onResult }: Props) {
  const [userId, setUserId] = useState("1");
  const [country, setCountry] = useState("MX");
  const [selectedHour, setSelectedHour] = useState("");
  const [selectedDayOfWeek, setSelectedDayOfWeek] = useState("");
  const [latitude, setLatitude] = useState("19.4326");
  const [longitude, setLongitude] = useState("-99.1332");
  const [hasCustomCoordinates, setHasCustomCoordinates] = useState(false);
  const [deviceChange, setDeviceChange] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [qrSeed, setQrSeed] = useState<number | null>(null);

  const qrPattern = useMemo(() => {
    if (qrSeed === null) return [];
    return buildStableQrPattern(qrSeed);
  }, [qrSeed]);

  useEffect(() => {
    setUserId("1");
    setCountry("MX");
    setSelectedHour("");
    setSelectedDayOfWeek("");
    setLatitude("19.4326");
    setLongitude("-99.1332");
    setHasCustomCoordinates(false);
    setDeviceChange(false);
    setIsSubmitting(false);
    setError(null);
    setQrSeed(null);
  }, [resetTrigger]);

  useEffect(() => {
    if (hasCustomCoordinates) return;
    const selected = COUNTRIES.find((item) => item.value === country);
    if (!selected) return;
    setLatitude(selected.defaultLat);
    setLongitude(selected.defaultLon);
  }, [country, hasCustomCoordinates]);

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

  const handleApplyCountryCoordinates = () => {
    const selected = COUNTRIES.find((item) => item.value === country);
    if (!selected) return;
    setLatitude(selected.defaultLat);
    setLongitude(selected.defaultLon);
    setHasCustomCoordinates(false);
  };

  const handleGenerateQR = () => {
    if (subtotal <= 0) {
      setError("Primero ingresa un monto válido en el resumen del pedido.");
      return;
    }
    setError(null);
    setQrSeed(Date.now());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    onResult(null);

    if (subtotal <= 0) {
      setError("Por favor ingrese un monto válido en el resumen del pedido");
      return;
    }

    if (qrSeed === null) {
      setError("Genera el código QR antes de realizar el pago.");
      return;
    }

    const parsedUserId = parseInt(userId, 10);
    const parsedLat = parseFloat(latitude);
    const parsedLon = parseFloat(longitude);

    if (!Number.isFinite(parsedUserId) || parsedUserId <= 0) {
      setError("ID de usuario inválido.");
      return;
    }
    if (!Number.isFinite(parsedLat) || parsedLat < -90 || parsedLat > 90) {
      setError("La latitud debe estar entre -90 y 90.");
      return;
    }
    if (!Number.isFinite(parsedLon) || parsedLon < -180 || parsedLon > 180) {
      setError("La longitud debe estar entre -180 y 180.");
      return;
    }

    setIsSubmitting(true);

    try {
      const txId = Math.floor(Math.random() * 900000) + 100000;
      const payload = {
        transaction_id: txId,
        user_id: parsedUserId,
        amount: subtotal,
        country: country,
        latitude: parsedLat,
        longitude: parsedLon,
        device_change_flag: deviceChange,
        ...(selectedHour !== "" ? { hour: parseInt(selectedHour, 10) } : {}),
        ...(selectedDayOfWeek !== "" ? { day_of_week: parseInt(selectedDayOfWeek, 10) } : {}),
      };

      const response = await fetch(`${API_BASE_URL}/qr-transactions/simple`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json", 
          "X-API-Key": "floreria_key"
         },
        body: JSON.stringify(payload),
        credentials: "include",
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({ detail: "QR Transaction failed" }));
        throw new Error(errData.detail || "QR Transaction failed");
      }

      const result = await response.json();
      onResult(result);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "QR Transaction failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <h2 className="text-lg font-semibold text-foreground">Pago con QR</h2>

      {/* QR Code Preview */}
      <div className="flex flex-col items-center gap-4">
        <div
          className={cn(
            "glass-qr-container w-52 h-52 rounded-3xl flex items-center justify-center",
            "transition-all duration-500",
            qrSeed !== null && "glass-qr-active"
          )}
        >
          {qrSeed !== null ? (
            <div className="relative">
              {/* QR visual estable para evitar regeneración por re-renders */}
              <div className="w-36 h-36 grid grid-cols-9 gap-[2px] p-2">
                {qrPattern.map((isDark, i) => {
                  return (
                    <div
                      key={i}
                      className={cn(
                        "rounded-sm transition-all duration-300",
                        isDark ? "bg-foreground/90" : "bg-transparent"
                      )}
                      style={{ animationDelay: `${i * 10}ms` }}
                    />
                  );
                })}
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
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
              <span className="text-sm font-medium">Generar código QR</span>
            </button>
          )}
        </div>
        {qrSeed !== null && (
          <p className="text-xs text-muted-foreground animate-fade-in">
            Escanea el código QR con tu aplicación bancaria para completar el pago.
          </p>
        )}
      </div>

      {/* QR Transaction Fields */}
      <div className="border-t border-white/10 pt-5">
        <h3 className="text-sm font-semibold text-foreground/70 uppercase tracking-wider mb-4">
          Detalles de la transacción
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="checkout-label">ID de Usuario</label>
            <input
              type="number"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="checkout-input"
              min="1"
              disabled={isSubmitting}
            />
          </div>
          <div>
            <label className="checkout-label">País</label>
            <CustomSelect
              value={country}
              onChange={setCountry}
              options={COUNTRIES.map((item) => ({ value: item.value, label: item.label }))}
              disabled={isSubmitting}
            />
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
            <CustomSelect
              value={selectedHour}
              onChange={setSelectedHour}
              options={hourOptions}
              disabled={isSubmitting}
            />
          </div>
          <div className="flex items-center gap-3">
            <label className="checkout-label mb-0">¿Es dispositivo nuevo?</label>
            <button
              type="button"
              onClick={() => setDeviceChange(!deviceChange)}
              disabled={isSubmitting}
              aria-pressed={deviceChange}
              className={cn(
                "relative w-12 h-7 rounded-full transition-all duration-300",
                deviceChange
                  ? "bg-primary/60 border border-primary/80"
                  : "bg-white/10 border border-white/20"
              )}
            >
              <div
                className={cn(
                  "absolute top-0.5 w-6 h-6 rounded-full transition-all duration-300 shadow-lg",
                  deviceChange
                    ? "left-[22px] bg-primary"
                    : "left-0.5 bg-white/60"
                )}
              />
            </button>
            <span className="text-xs text-muted-foreground">
              {deviceChange ? "Sí" : "No"}
            </span>
          </div>
        </div>
      </div>

      {/* Location */}
      <div className="border-t border-white/10 pt-5">
        <h3 className="text-sm font-semibold text-foreground/70 uppercase tracking-wider mb-1 flex items-center gap-2">
          <MapPin size={14} />
          Datos de Ubicación
        </h3>
        <p className="text-xs text-muted-foreground mb-4">
          Usa coordenadas reales aproximadas del lugar de pago. Latitud: -90 a 90, Longitud: -180 a 180.
        </p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="checkout-label">Latitud</label>
            <input
              type="text"
              value={latitude}
              onChange={(e) => {
                setLatitude(e.target.value);
                setHasCustomCoordinates(true);
              }}
              placeholder="19.4326"
              className="checkout-input"
              disabled={isSubmitting}
            />
          </div>
          <div>
            <label className="checkout-label">Longitud</label>
            <input
              type="text"
              value={longitude}
              onChange={(e) => {
                setLongitude(e.target.value);
                setHasCustomCoordinates(true);
              }}
              placeholder="-99.1332"
              className="checkout-input"
              disabled={isSubmitting}
            />
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span>Ejemplo México (CDMX): 19.4326, -99.1332</span>
          <button
            type="button"
            onClick={handleApplyCountryCoordinates}
            disabled={isSubmitting}
            className="underline underline-offset-4 hover:text-foreground disabled:opacity-50"
          >
            Usar coordenadas sugeridas del país
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="glass-checkout-alert-error rounded-2xl p-4 flex items-center gap-3 animate-fade-in">
          <AlertTriangle size={18} className="text-red-400 shrink-0" />
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}

      <div className="rounded-lg border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
        Modo pruebas activo: el formulario no se reinicia al completar una transacción.
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isSubmitting || subtotal <= 0 || qrSeed === null}
        className={cn(
          "checkout-button-primary w-full py-4 rounded-2xl text-base font-semibold",
          "flex items-center justify-center gap-2",
          "disabled:opacity-40 disabled:cursor-not-allowed"
        )}
      >
        {isSubmitting ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            Analizando transacción QR...
          </>
        ) : (
          <>
            <ShieldCheck size={18} />
            Pagar ${subtotal.toFixed(2)} y analizar con QR
          </>
        )}
      </button>
    </form>
  );
}
