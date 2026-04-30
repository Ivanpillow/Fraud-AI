"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { CreditCard, QrCode, Bitcoin } from "lucide-react";
import DemoLibreriaCardPaymentForm from "@/components/demo-libreria/card-payment-form";
import DemoLibreriaQRPaymentForm from "@/components/demo-libreria/qr-payment-form";
import DemoLibreriaCryptoPaymentForm from "@/components/demo-libreria/crypto-payment-form";
import DemoLibreriaOrderSummary from "@/components/demo-libreria/order-summary";
import { cn } from "@/lib/utils";
import { loadDemoLibreriaCheckoutContext } from "@/lib/demo-libreria-checkout-context";
import { getDemoLibreriaRuntimeCheckoutContext } from "@/lib/demo-libreria-runtime-context";
import { clearDemoLibreriaCart } from "@/lib/demo-libreria-cart";

type PaymentMethod = "card" | "qr" | "crypto";

export default function DemoLibreriaCheckoutPage() {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>("card");
  const [subtotal, setSubtotal] = useState<number>(0);
  const [resetTrigger, setResetTrigger] = useState(0);
  const [merchantApiKey, setMerchantApiKey] = useState<string>("libreria_key");
  const [merchantName, setMerchantName] = useState<string | null>(null);
  const [returnUrl, setReturnUrl] = useState<string | null>("/demo-libreria/carrito");
  const total = subtotal;

  const [fraudResult, setFraudResult] = useState<{
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

  const handleTransactionResult = useCallback(
    (result: typeof fraudResult) => {
      setFraudResult(result);
    },
    []
  );

  const handleNewTransaction = useCallback(() => {
    setFraudResult(null);
    setSubtotal(0);
    setSelectedMethod("card");
    setResetTrigger((prev) => prev + 1);
  }, []);

  useEffect(() => {
    const ctx = loadDemoLibreriaCheckoutContext();
    if (!ctx) return;

    setMerchantApiKey(ctx.merchant.apiKey);
    setMerchantName(ctx.merchant.name || null);
    setReturnUrl(ctx.returnUrl || null);

    if (Number.isFinite(ctx.cart?.subtotal)) {
      setSubtotal(Number(ctx.cart.subtotal));
    }

    getDemoLibreriaRuntimeCheckoutContext();
  }, []);

  useEffect(() => {
    if (!fraudResult) return;
    clearDemoLibreriaCart();
  }, [fraudResult]);

  const paymentMethods = [
    { id: "card" as PaymentMethod, label: "Tarjeta", icon: CreditCard },
    { id: "qr" as PaymentMethod, label: "Codigo QR", icon: QrCode },
    { id: "crypto" as PaymentMethod, label: "Criptomoneda", icon: Bitcoin },
  ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8 md:py-12">
      <div className="w-full max-w-6xl mb-8 animate-fade-in">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
          Checkout Libreria
        </h1>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          {merchantName && (
            <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-muted-foreground">
              Comercio: <span className="text-foreground">{merchantName}</span>
            </div>
          )}
          {returnUrl && (
            <Link
              href={returnUrl}
              className="inline-flex items-center gap-2 rounded-2xl border border-primary/35 bg-primary/20 px-3 py-1.5 text-xs font-medium text-foreground transition-all hover:bg-primary/30 hover:border-primary/50"
            >
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary/25 text-[10px]">
                ←
              </span>
              Regresar al carrito
            </Link>
          )}
        </div>
        <p className="text-muted-foreground mt-1 text-sm md:text-base">
          Ejemplo de checkout para Libreria BookSwap, mostrando un flujo real de ecommerce con gestion de carrito y checkout antifraude con FraudAI.
        </p>
      </div>

      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-6">
        <div className="flex flex-col gap-6 animate-fade-in">
          <div className="glass-checkout-card rounded-3xl p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Selecciona un metodo de pago
            </h2>
            <div className="flex gap-3">
              {paymentMethods.map((method) => {
                const Icon = method.icon;
                const isActive = selectedMethod === method.id;
                return (
                  <button
                    key={method.id}
                    onClick={() => {
                      setSelectedMethod(method.id);
                      setFraudResult(null);
                    }}
                    className={cn(
                      "glass-checkout-pill flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-medium transition-all duration-300",
                      isActive
                        ? "glass-checkout-pill-active text-foreground shadow-lg shadow-primary/20"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Icon size={18} />
                    <span>{method.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="glass-checkout-card rounded-3xl p-6">
            {selectedMethod === "card" && (
              <DemoLibreriaCardPaymentForm
                amount={total}
                apiKey={merchantApiKey}
                resetTrigger={resetTrigger}
                onResult={handleTransactionResult}
              />
            )}
            {selectedMethod === "qr" && (
              <DemoLibreriaQRPaymentForm
                subtotal={subtotal}
                apiKey={merchantApiKey}
                resetTrigger={resetTrigger}
                onResult={handleTransactionResult}
              />
            )}
            {selectedMethod === "crypto" && (
              <DemoLibreriaCryptoPaymentForm
                subtotal={subtotal}
                apiKey={merchantApiKey}
                resetTrigger={resetTrigger}
                onResult={handleTransactionResult}
              />
            )}
          </div>
        </div>

        <div className="animate-fade-in" style={{ animationDelay: "0.1s" }}>
          <DemoLibreriaOrderSummary
            subtotal={subtotal}
            total={total}
            fraudResult={fraudResult}
            onNewTransaction={handleNewTransaction}
          />
        </div>
      </div>
    </div>
  );
}
