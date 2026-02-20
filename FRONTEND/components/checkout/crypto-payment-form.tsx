"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";

/* Crypto brand info */
interface CryptoInfo {
  name: string;
  symbol: string;
  color: string;
  gradient: string;
  icon: string;
}

const CRYPTOS: CryptoInfo[] = [
  {
    name: "Bitcoin",
    symbol: "BTC",
    color: "#F7931A",
    gradient: "from-orange-600/20 to-yellow-600/10",
    icon: "₿",
  },
  {
    name: "Ethereum",
    symbol: "ETH",
    color: "#627EEA",
    gradient: "from-indigo-600/20 to-purple-600/10",
    icon: "Ξ",
  },
  {
    name: "BNB",
    symbol: "BNB",
    color: "#F3BA2F",
    gradient: "from-yellow-600/20 to-amber-600/10",
    icon: "◆",
  },
  {
    name: "Solana",
    symbol: "SOL",
    color: "#9945FF",
    gradient: "from-purple-600/20 to-cyan-600/10",
    icon: "◎",
  },
  {
    name: "XRP",
    symbol: "XRP",
    color: "#23292F",
    gradient: "from-slate-600/20 to-blue-600/10",
    icon: "✕",
  },
];

interface Props {
  subtotal: number;
}

export default function CryptoPaymentForm({ subtotal }: Props) {
  const [selectedCrypto, setSelectedCrypto] = useState<string>("BTC");
  const [walletAddress, setWalletAddress] = useState("");

  const selected = CRYPTOS.find((c) => c.symbol === selectedCrypto)!;

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-lg font-semibold text-foreground">
        Cryptocurrency Payment
      </h2>

      {/* Template Notice */}
      <div className="glass-checkout-alert-info rounded-2xl p-4 flex items-start gap-3 animate-fade-in">
        <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0 mt-0.5">
          <span className="text-xs text-blue-400">i</span>
        </div>
        <div>
          <p className="text-sm text-blue-300 font-medium">Template Mode</p>
          <p className="text-xs text-blue-300/70 mt-1">
            Cryptocurrency payments are not yet connected to the backend fraud
            detection system. This UI serves as a design template for future
            integration.
          </p>
        </div>
      </div>

      {/* Crypto Selector */}
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
                isActive
                  ? "glass-crypto-active border-white/20 shadow-lg"
                  : "border-white/5 hover:border-white/10"
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
                  isActive
                    ? "scale-110 shadow-lg"
                    : "scale-100"
                )}
                style={
                  isActive
                    ? { color: crypto.color, textShadow: `0 0 8px ${crypto.color}60` }
                    : { color: `${crypto.color}80` }
                }
              >
                {crypto.icon}
              </div>
              <span
                className={cn(
                  "text-xs font-semibold transition-colors duration-200",
                  isActive ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {crypto.symbol}
              </span>
            </button>
          );
        })}
      </div>

      {/* Selected Crypto Info */}
      <div
        className={cn(
          "glass-checkout-card rounded-2xl p-5 bg-gradient-to-br",
          selected.gradient
        )}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">You pay</p>
            <p className="text-2xl font-bold text-foreground mt-1">
              ${subtotal.toFixed(2)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Currency</p>
            <p className="text-2xl font-bold mt-1" style={{ color: selected.color }}>
              {selected.symbol}
            </p>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-white/10">
          <p className="text-xs text-muted-foreground">
            Estimated conversion rate will be shown when this module is
            connected to the backend.
          </p>
        </div>
      </div>

      {/* Wallet Address */}
      <div>
        <label className="checkout-label">Wallet Address</label>
        <input
          type="text"
          value={walletAddress}
          onChange={(e) => setWalletAddress(e.target.value)}
          placeholder={`Enter your ${selected.symbol} wallet address`}
          className="checkout-input font-mono text-sm"
        />
      </div>

      {/* Submit (Disabled - Template) */}
      <button
        type="button"
        disabled
        className={cn(
          "checkout-button-primary w-full py-4 rounded-2xl text-base font-semibold opacity-50 cursor-not-allowed",
          "flex items-center justify-center gap-2"
        )}
      >
        <span
          className="w-5 h-5 rounded-full flex items-center justify-center text-sm font-bold"
          style={{ color: selected.color }}
        >
          {selected.icon}
        </span>
        Pay with {selected.name} (Coming Soon)
      </button>
    </div>
  );
}
