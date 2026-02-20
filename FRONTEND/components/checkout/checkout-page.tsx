"use client";

import React, { useState, useCallback } from "react";
import { CreditCard, QrCode, Bitcoin } from "lucide-react";
import CardPaymentForm from "./card-payment-form";
import QRPaymentForm from "./qr-payment-form";
import CryptoPaymentForm from "./crypto-payment-form";
import OrderSummary from "./order-summary";
import { cn } from "@/lib/utils";

type PaymentMethod = "card" | "qr" | "crypto";

export default function CheckoutPage() {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>("card");
  const [subtotal, setSubtotal] = useState<number>(0);
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

  const paymentMethods = [
    { id: "card" as PaymentMethod, label: "Card", icon: CreditCard },
    { id: "qr" as PaymentMethod, label: "QR Code", icon: QrCode },
    { id: "crypto" as PaymentMethod, label: "Crypto", icon: Bitcoin },
  ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8 md:py-12">
      {/* Header */}
      <div className="w-full max-w-6xl mb-8 animate-fade-in">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
          Checkout
        </h1>
        <p className="text-muted-foreground mt-1 text-sm md:text-base">
          Complete your payment securely with fraud detection powered by AI
        </p>
      </div>

      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-6">
        {/* Left Column - Payment Form */}
        <div className="flex flex-col gap-6 animate-fade-in">
          {/* Payment Method Selector */}
          <div className="glass-checkout-card rounded-3xl p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Choose a payment method
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

          {/* Payment Form */}
          <div className="glass-checkout-card rounded-3xl p-6">
            {selectedMethod === "card" && (
              <CardPaymentForm
                subtotal={subtotal}
                onResult={handleTransactionResult}
              />
            )}
            {selectedMethod === "qr" && (
              <QRPaymentForm
                subtotal={subtotal}
                onResult={handleTransactionResult}
              />
            )}
            {selectedMethod === "crypto" && (
              <CryptoPaymentForm subtotal={subtotal} />
            )}
          </div>
        </div>

        {/* Right Column - Order Summary */}
        <div className="animate-fade-in" style={{ animationDelay: "0.1s" }}>
          <OrderSummary
            subtotal={subtotal}
            onSubtotalChange={setSubtotal}
            fraudResult={fraudResult}
          />
        </div>
      </div>
    </div>
  );
}
