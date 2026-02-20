"use client";

import React, { useState } from "react";
import { QrCode, Loader2, AlertTriangle, ShieldCheck, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { API_BASE_URL } from "@/lib/api";

interface Props {
  subtotal: number;
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

export default function QRPaymentForm({ subtotal, onResult }: Props) {
  const [userId, setUserId] = useState("1");
  const [merchantId, setMerchantId] = useState("1");
  const [country, setCountry] = useState("MX");
  const [latitude, setLatitude] = useState("20.6597");
  const [longitude, setLongitude] = useState("-103.3496");
  const [deviceChange, setDeviceChange] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [qrGenerated, setQrGenerated] = useState(false);

  const countries = [
    { value: "MX", label: "Mexico" },
    { value: "US", label: "United States" },
    { value: "CA", label: "Canada" },
    { value: "GB", label: "United Kingdom" },
    { value: "DE", label: "Germany" },
    { value: "JP", label: "Japan" },
    { value: "BR", label: "Brazil" },
    { value: "IN", label: "India" },
  ];

  const handleGenerateQR = () => {
    setQrGenerated(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    onResult(null);

    if (subtotal <= 0) {
      setError("Please enter a valid subtotal amount in the order summary");
      return;
    }

    setIsSubmitting(true);

    try {
      const txId = Math.floor(Math.random() * 900000) + 100000;
      const payload = {
        transaction_id: txId,
        user_id: parseInt(userId) || 1,
        amount: subtotal,
        merchant_id: parseInt(merchantId) || 1,
        country: country,
        latitude: parseFloat(latitude) || 20.6597,
        longitude: parseFloat(longitude) || -103.3496,
        device_change_flag: deviceChange,
      };

      const response = await fetch(`${API_BASE_URL}/qr-transactions/simple`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
      <h2 className="text-lg font-semibold text-foreground">QR Code Payment</h2>

      {/* QR Code Preview */}
      <div className="flex flex-col items-center gap-4">
        <div
          className={cn(
            "glass-qr-container w-52 h-52 rounded-3xl flex items-center justify-center",
            "transition-all duration-500",
            qrGenerated && "glass-qr-active"
          )}
        >
          {qrGenerated ? (
            <div className="relative">
              {/* Simulated QR pattern */}
              <div className="w-36 h-36 grid grid-cols-9 gap-[2px] p-2">
                {Array.from({ length: 81 }).map((_, i) => {
                  const isCorner =
                    (i < 3 || (i >= 6 && i < 9)) && (Math.floor(i / 9) < 3) ||
                    (i % 9 < 3 || i % 9 >= 6) && Math.floor(i / 9) < 3 ||
                    (i % 9 < 3) && Math.floor(i / 9) >= 6;
                  const isRandom = Math.random() > 0.5;
                  return (
                    <div
                      key={i}
                      className={cn(
                        "rounded-sm transition-all duration-300",
                        isCorner || isRandom
                          ? "bg-foreground/90"
                          : "bg-transparent"
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
              className="flex flex-col items-center gap-3 text-muted-foreground hover:text-foreground transition-colors"
            >
              <QrCode size={48} className="opacity-40" />
              <span className="text-sm font-medium">Generate QR Code</span>
            </button>
          )}
        </div>
        {qrGenerated && (
          <p className="text-xs text-muted-foreground animate-fade-in">
            Scan with your banking app to pay
          </p>
        )}
      </div>

      {/* QR Transaction Fields */}
      <div className="border-t border-white/10 pt-5">
        <h3 className="text-sm font-semibold text-foreground/70 uppercase tracking-wider mb-4">
          Transaction Details
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="checkout-label">User ID</label>
            <input
              type="number"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="checkout-input"
              min="1"
            />
          </div>
          <div>
            <label className="checkout-label">Merchant ID</label>
            <input
              type="number"
              value={merchantId}
              onChange={(e) => setMerchantId(e.target.value)}
              className="checkout-input"
              min="1"
            />
          </div>
          <div>
            <label className="checkout-label">Country</label>
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="checkout-input checkout-select"
            >
              {countries.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-3">
            <label className="checkout-label mb-0">Device Changed?</label>
            <button
              type="button"
              onClick={() => setDeviceChange(!deviceChange)}
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
          </div>
        </div>
      </div>

      {/* Location */}
      <div className="border-t border-white/10 pt-5">
        <h3 className="text-sm font-semibold text-foreground/70 uppercase tracking-wider mb-1 flex items-center gap-2">
          <MapPin size={14} />
          Location Data
        </h3>
        <p className="text-xs text-muted-foreground mb-4">
          Used for geolocation-based fraud analysis
        </p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="checkout-label">Latitude</label>
            <input
              type="text"
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
              placeholder="20.6597"
              className="checkout-input"
            />
          </div>
          <div>
            <label className="checkout-label">Longitude</label>
            <input
              type="text"
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
              placeholder="-103.3496"
              className="checkout-input"
            />
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="glass-checkout-alert-error rounded-2xl p-4 flex items-center gap-3 animate-fade-in">
          <AlertTriangle size={18} className="text-red-400 shrink-0" />
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}

      {/* Submit */}
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
            Analyzing QR Transaction...
          </>
        ) : (
          <>
            <ShieldCheck size={18} />
            Pay ${subtotal.toFixed(2)} via QR
          </>
        )}
      </button>
    </form>
  );
}
