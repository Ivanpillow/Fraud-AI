"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  CreditCard,
  Loader2,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createSimpleTransaction, API_BASE_URL } from "@/lib/api";

/* ── Card brand detection ── */
type CardBrand = "visa" | "mastercard" | "amex" | "discover" | "unknown";

interface CardBrandInfo {
  name: string;
  color: string;
  gradient: string;
  pattern: RegExp;
  lengths: number[];
  cvvLength: number;
  logo: string;
}

const CARD_BRANDS: Record<CardBrand, CardBrandInfo> = {
  visa: {
    name: "Visa",
    color: "#1A1F71",
    gradient: "from-blue-900 via-blue-800 to-blue-600",
    pattern: /^4/,
    lengths: [16],
    cvvLength: 3,
    logo: "VISA",
  },
  mastercard: {
    name: "Mastercard",
    color: "#EB001B",
    gradient: "from-red-900 via-orange-800 to-yellow-600",
    pattern: /^(5[1-5]|2[2-7])/,
    lengths: [16],
    cvvLength: 3,
    logo: "MC",
  },
  amex: {
    name: "American Express",
    color: "#006FCF",
    gradient: "from-cyan-900 via-teal-800 to-emerald-600",
    pattern: /^3[47]/,
    lengths: [15],
    cvvLength: 4,
    logo: "AMEX",
  },
  discover: {
    name: "Discover",
    color: "#FF6000",
    gradient: "from-orange-900 via-orange-700 to-amber-500",
    pattern: /^(6011|65|64[4-9])/,
    lengths: [16],
    cvvLength: 3,
    logo: "DISC",
  },
  unknown: {
    name: "Card",
    color: "#555",
    gradient: "from-zinc-800 via-zinc-700 to-zinc-600",
    pattern: /^$/,
    lengths: [16],
    cvvLength: 3,
    logo: "••••",
  },
};

function detectCardBrand(number: string): CardBrand {
  const digits = number.replace(/\D/g, "");
  if (!digits) return "unknown";
  for (const [brand, info] of Object.entries(CARD_BRANDS)) {
    if (brand === "unknown") continue;
    if (info.pattern.test(digits)) return brand as CardBrand;
  }
  return "unknown";
}

function formatCardNumber(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 19);
  const brand = detectCardBrand(digits);
  // Amex: 4-6-5, others: 4-4-4-4
  if (brand === "amex") {
    return digits.replace(/(\d{4})(\d{0,6})(\d{0,5})/, (_, a, b, c) =>
      [a, b, c].filter(Boolean).join(" ")
    );
  }
  return digits.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
}

function formatExpiry(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length > 2) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return digits;
}

/* ── Card brand logos SVG-like components ── */
function CardBrandLogo({ brand }: { brand: CardBrand }) {
  const info = CARD_BRANDS[brand];

  if (brand === "visa") {
    return (
      <div className="flex items-center justify-center w-16 h-10 rounded-lg font-extrabold text-white text-lg italic tracking-tight bg-[#1A1F71]/80 border border-white/20">
        VISA
      </div>
    );
  }
  if (brand === "mastercard") {
    return (
      <div className="flex items-center justify-center w-16 h-10">
        <div className="relative w-10 h-10">
          <div className="absolute left-0 top-1 w-7 h-7 rounded-full bg-red-600/90 border border-white/20" />
          <div className="absolute right-0 top-1 w-7 h-7 rounded-full bg-yellow-500/90 border border-white/20 mix-blend-multiply" />
        </div>
      </div>
    );
  }
  if (brand === "amex") {
    return (
      <div className="flex items-center justify-center w-16 h-10 rounded-lg font-bold text-white text-xs tracking-widest bg-[#006FCF]/80 border border-white/20">
        AMEX
      </div>
    );
  }
  if (brand === "discover") {
    return (
      <div className="flex items-center justify-center w-16 h-10 rounded-lg bg-white/10 border border-white/20">
        <div className="w-5 h-5 rounded-full bg-orange-500/90" />
      </div>
    );
  }
  return (
    <div className="flex items-center justify-center w-16 h-10 rounded-lg bg-white/10 border border-white/20">
      <CreditCard size={20} className="text-white/50" />
    </div>
  );
}

/* ── Component ── */
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

export default function CardPaymentForm({ subtotal, onResult }: Props) {
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");

  // Fraud-relevant fields
  const [userId, setUserId] = useState("1");
  const [merchantCategory, setMerchantCategory] = useState("retail");
  const [country, setCountry] = useState("MX");
  const [deviceType, setDeviceType] = useState("desktop");

  // Shipping info (for model variables - no cost calculation)
  const [shippingName, setShippingName] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [shippingCity, setShippingCity] = useState("");
  const [shippingCountry, setShippingCountry] = useState("MX");
  const [shippingZip, setShippingZip] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const brand = useMemo(() => detectCardBrand(cardNumber), [cardNumber]);
  const brandInfo = CARD_BRANDS[brand];
  const [prevBrand, setPrevBrand] = useState<CardBrand>("unknown");
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (brand !== prevBrand) {
      setPrevBrand(brand);
      if (cardRef.current) {
        cardRef.current.classList.remove("card-brand-animate");
        // Force reflow
        void cardRef.current.offsetWidth;
        cardRef.current.classList.add("card-brand-animate");
      }
    }
  }, [brand, prevBrand]);

  const merchantCategories = [
    { value: "retail", label: "Retail" },
    { value: "food", label: "Food & Dining" },
    { value: "travel", label: "Travel" },
    { value: "entertainment", label: "Entertainment" },
    { value: "utilities", label: "Utilities" },
    { value: "health", label: "Health" },
    { value: "education", label: "Education" },
    { value: "technology", label: "Technology" },
  ];

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    onResult(null);

    if (!cardNumber || !cardName || !expiry || !cvv) {
      setError("Please fill in all card details");
      return;
    }
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
        merchant_category: merchantCategory,
        country: country,
        device_type: deviceType,
      };

      const response = await fetch(`${API_BASE_URL}/transactions/simple`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({ detail: "Transaction failed" }));
        throw new Error(errData.detail || "Transaction failed");
      }

      const result = await response.json();
      onResult(result);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Transaction failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <h2 className="text-lg font-semibold text-foreground">Card Details</h2>

      {/* ── Animated Card Preview ── */}
      <div
        ref={cardRef}
        className={cn(
          "relative w-full max-w-[380px] mx-auto aspect-[1.586/1] rounded-3xl p-6 flex flex-col justify-between",
          "bg-gradient-to-br shadow-2xl transition-all duration-700 ease-out",
          brandInfo.gradient,
          "glass-card-preview"
        )}
      >
        <div className="absolute inset-0 rounded-3xl bg-white/5 backdrop-blur-sm border border-white/10" />
        <div className="relative z-10 flex justify-between items-start">
          <div className="w-12 h-9 rounded-lg bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-600 border border-yellow-200/30 shadow-inner" />
          <CardBrandLogo brand={brand} />
        </div>
        <div className="relative z-10 mt-auto space-y-3">
          <p className="text-white/90 text-lg md:text-xl font-mono tracking-[0.2em]">
            {cardNumber ? formatCardNumber(cardNumber) : "•••• •••• •••• ••••"}
          </p>
          <div className="flex justify-between items-end">
            <div>
              <p className="text-[10px] text-white/50 uppercase tracking-widest">
                Card Holder
              </p>
              <p className="text-white/80 text-sm font-medium uppercase tracking-wide">
                {cardName || "YOUR NAME"}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-white/50 uppercase tracking-widest">
                Expires
              </p>
              <p className="text-white/80 text-sm font-mono">
                {expiry || "MM/YY"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Card Fields ── */}
      <div className="grid grid-cols-1 gap-4">
        <div>
          <label className="checkout-label">Name on card</label>
          <input
            type="text"
            value={cardName}
            onChange={(e) => setCardName(e.target.value)}
            placeholder="John Doe"
            className="checkout-input"
          />
        </div>
        <div>
          <label className="checkout-label">Card Number</label>
          <div className="relative">
            <input
              type="text"
              inputMode="numeric"
              value={formatCardNumber(cardNumber)}
              onChange={(e) =>
                setCardNumber(e.target.value.replace(/\D/g, "").slice(0, 19))
              }
              placeholder="1234 5678 9012 3456"
              className="checkout-input pr-20"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 transition-all duration-300">
              <CardBrandLogo brand={brand} />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="checkout-label">Exp (MM/YY)</label>
            <input
              type="text"
              inputMode="numeric"
              value={expiry}
              onChange={(e) => setExpiry(formatExpiry(e.target.value))}
              placeholder="12/28"
              maxLength={5}
              className="checkout-input"
            />
          </div>
          <div>
            <label className="checkout-label">
              {brand === "amex" ? "CID (4 digits)" : "CVV"}
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={cvv}
              onChange={(e) =>
                setCvv(
                  e.target.value
                    .replace(/\D/g, "")
                    .slice(0, brandInfo.cvvLength)
                )
              }
              placeholder={brand === "amex" ? "1234" : "123"}
              maxLength={brandInfo.cvvLength}
              className="checkout-input"
            />
          </div>
        </div>
      </div>

      {/* ── Fraud Detection Variables ── */}
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
            <label className="checkout-label">Device Type</label>
            <select
              value={deviceType}
              onChange={(e) => setDeviceType(e.target.value)}
              className="checkout-input checkout-select"
            >
              <option value="desktop">Desktop</option>
              <option value="mobile">Mobile</option>
              <option value="tablet">Tablet</option>
            </select>
          </div>
          <div>
            <label className="checkout-label">Category</label>
            <select
              value={merchantCategory}
              onChange={(e) => setMerchantCategory(e.target.value)}
              className="checkout-input checkout-select"
            >
              {merchantCategories.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
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
        </div>
      </div>

      {/* ── Shipping Address (for model variables, no cost) ── */}
      <div className="border-t border-white/10 pt-5">
        <h3 className="text-sm font-semibold text-foreground/70 uppercase tracking-wider mb-1">
          Shipping Address
        </h3>
        <p className="text-xs text-muted-foreground mb-4">
          Required for fraud analysis — no shipping cost will be calculated
        </p>
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="checkout-label">Full Name</label>
            <input
              type="text"
              value={shippingName}
              onChange={(e) => setShippingName(e.target.value)}
              placeholder="John Doe"
              className="checkout-input"
            />
          </div>
          <div>
            <label className="checkout-label">Address</label>
            <input
              type="text"
              value={shippingAddress}
              onChange={(e) => setShippingAddress(e.target.value)}
              placeholder="123 Main Street"
              className="checkout-input"
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="checkout-label">City</label>
              <input
                type="text"
                value={shippingCity}
                onChange={(e) => setShippingCity(e.target.value)}
                placeholder="Guadalajara"
                className="checkout-input"
              />
            </div>
            <div>
              <label className="checkout-label">Country</label>
              <select
                value={shippingCountry}
                onChange={(e) => setShippingCountry(e.target.value)}
                className="checkout-input checkout-select"
              >
                {countries.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="checkout-label">ZIP Code</label>
              <input
                type="text"
                value={shippingZip}
                onChange={(e) => setShippingZip(e.target.value)}
                placeholder="44100"
                className="checkout-input"
              />
            </div>
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
            Analyzing Transaction...
          </>
        ) : (
          <>
            <ShieldCheck size={18} />
            Pay ${subtotal.toFixed(2)} & Analyze
          </>
        )}
      </button>
    </form>
  );
}
