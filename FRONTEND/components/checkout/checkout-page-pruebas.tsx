"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CreditCard, QrCode, Bitcoin } from "lucide-react";
import CardPaymentForm from "./card-payment-form";
import QRPaymentForm from "./qr-payment-form";
import CryptoPaymentForm from "./crypto-payment-form";
import OrderSummary from "./order-summary";
import CustomSelect from "./custom-select";
import { cn } from "@/lib/utils";
import { loadFraudAICheckoutContext } from "@/lib/fraudai-checkout-context";
import { API_BASE_URL, fetchQrSessionStatus } from "@/lib/api";
import { readHttpErrorMessage } from "@/lib/utils";
import { navigateToFraudResult, type FraudResultPayload } from "@/lib/fraud-result-routing";
import { clearDemoEcommerceCart } from "@/lib/demo-ecommerce-cart";
import { clearDemoLibreriaCart } from "@/lib/demo-libreria-cart";

type PaymentMethod = "card" | "qr" | "crypto";

type TaxCode = "MX" | "US" | "EU";

const TAX_OPTIONS: Record<"MX" | "US" | "EU", number> = {
  MX: 0.16,
  US: 0.08,
  EU: 0.20,
};

const MERCHANT_KEY_OPTIONS = [
  { value: "floreria_key", label: "Florería - floreria_key" },
  { value: "sk_test_demo_merchant", label: "Demo Merchant - sk_test_demo_merchant" },
  { value: "libreria_api_key", label: "BookSwap - libreria_api_key" },
  { value: "sk_comercio_2_key", label: "Prueba Comercio 2 - sk_comercio_2_key" },
];

function normalizeTestMerchantApiKey(apiKey: string): string {
  if (apiKey === "libreria_key") return "libreria_api_key";
  if (apiKey === "Prueba_Comercio_2") return "sk_comercio_2_key";
  return apiKey;
}

export default function CheckoutPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>("card");
  const [subtotal, setSubtotal] = useState<number>(0);
  const [selectedTax, setSelectedTax] = useState<TaxCode | null>(null);
  const [resetTrigger, setResetTrigger] = useState(0);
  const [merchantApiKey, setMerchantApiKey] = useState<string>("floreria_key");
  const [merchantName, setMerchantName] = useState<string | null>(null);
  const [returnUrl, setReturnUrl] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [pendingQrTransactionId, setPendingQrTransactionId] = useState<number | null>(null);

  const taxRate = selectedTax ? TAX_OPTIONS[selectedTax] : 0;
  const taxAmount = subtotal * taxRate;
  const total = subtotal + taxAmount;

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
    (result: FraudResultPayload | null) => {
      setIsPolling(false);
      setPendingQrTransactionId(null);

      if (!result) {
        setFraudResult(null);
        return;
      }

      navigateToFraudResult(result, returnUrl ?? "/checkout");
    },
    [returnUrl]
  );

  const handleNewTransaction = useCallback(() => {
    setFraudResult(null);
    setPendingQrTransactionId(null);
    setSubtotal(0);
    setSelectedTax(null);
    setSelectedMethod("card");
    setResetTrigger((prev) => prev + 1);
    // Limpiar parámetros de URL
    router.replace("/checkout");
  }, [router]);

  const handleQrSessionCreated = useCallback((transactionId: number | null) => {
    setPendingQrTransactionId(transactionId);
  }, []);

  // Polling para obtener resultado de QR después de redirigir desde el móvil
  useEffect(() => {
    const transactionId = searchParams.get("transactionId");
    const decision = searchParams.get("decision");
    const fraudProbability = searchParams.get("fraud_probability");

    // No hacer polling si no tenemos todos los parámetros necesarios
    if (!transactionId || decision === null || fraudProbability === null) {
      return;
    }

    // No hacer polling si la API key no está lista (aún está en el valor por defecto)
    if (!merchantApiKey) {
      return;
    }

    setIsPolling(true);
    setSelectedMethod("qr");

    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/qr-transactions/${transactionId}`,
          {
            method: "GET",
            headers: {
              "X-API-Key": merchantApiKey,
            },
            credentials: "include",
          }
        );

        if (response.ok) {
          const data = await response.json();
          handleTransactionResult(data);
          clearInterval(pollInterval);
        }
      } catch (error) {
        console.error("Error polling transaction result:", error);
      }
    }, 1000); // Poll cada segundo

    // Timeout de 30 segundos
    const timeout = setTimeout(() => {
      clearInterval(pollInterval);
      setIsPolling(false);
      // Mostrar resultado con los parámetros de la URL como fallback
      const result = {
        transaction_id: parseInt(transactionId, 10),
        fraud_probability: parseFloat(fraudProbability),
        decision: decision,
        model_scores: {
          random_forest: 0,
          logistic_regression: 0,
          kmeans_anomaly: 0,
        },
      };
      handleTransactionResult(result);
    }, 30000);

    return () => {
      clearInterval(pollInterval);
      clearTimeout(timeout);
    };
  }, [searchParams, merchantApiKey, handleTransactionResult]);

  useEffect(() => {
    if (!pendingQrTransactionId || !merchantApiKey) {
      return;
    }

    setIsPolling(true);
    setSelectedMethod("qr");

    const pollInterval = window.setInterval(async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/qr-transactions/${pendingQrTransactionId}`, {
          method: "GET",
          headers: {
            "X-API-Key": merchantApiKey,
          },
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          handleTransactionResult(data);
          clearInterval(pollInterval);
        }
      } catch (error) {
        console.error("Error polling QR transaction result:", error);
      }
    }, 1000);

    return () => {
      clearInterval(pollInterval);
    };
  }, [pendingQrTransactionId, merchantApiKey, handleTransactionResult]);

  useEffect(() => {
    if (!pendingQrTransactionId || !merchantApiKey) return;

    const interval = window.setInterval(async () => {
      const res = await fetchQrSessionStatus(merchantApiKey, pendingQrTransactionId);
      if (!res.data) return;

      if (res.data.status === "cancelled") {
        setIsPolling(false);
        setPendingQrTransactionId(null);
        setSelectedMethod("card");
      }
    }, 1500);

    return () => {
      window.clearInterval(interval);
    };
  }, [pendingQrTransactionId, merchantApiKey]);

  useEffect(() => {
    clearDemoEcommerceCart();
    clearDemoLibreriaCart();
  }, []);

  

  const paymentMethods = [
    { id: "card" as PaymentMethod, label: "Tarjeta", icon: CreditCard },
    { id: "qr" as PaymentMethod, label: "Código QR", icon: QrCode },
    { id: "crypto" as PaymentMethod, label: "Criptomoneda", icon: Bitcoin },
  ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8 md:py-12">
      <div className="w-full max-w-6xl mb-8 animate-fade-in">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
          Checkout
        </h1>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <div className="w-full max-w-md">
            <CustomSelect
              value={merchantApiKey}
              onChange={setMerchantApiKey}
              options={MERCHANT_KEY_OPTIONS}
              placeholder="Selecciona la llave de comercio"
            />
          </div>
          {/* {returnUrl && (
            <a
              href={returnUrl}
              className="rounded-2xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-muted-foreground hover:bg-white/10 transition-all"
            >
              Volver a la tienda
            </a>
          )} */}
        </div>
        <p className="text-muted-foreground mt-1 text-sm md:text-base">
          Realiza tu pago y obtén una evaluación de riesgo instantánea para tu transacción.
        </p>
      </div>

      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-6">
        <div className="flex flex-col gap-6 animate-fade-in">
          {isPolling && (
            <div className="glass-checkout-card rounded-3xl p-6 bg-blue-500/10 border border-blue-500/20">
              <div className="flex items-center gap-3">
                <div className="relative h-5 w-5">
                  <div className="absolute inset-0 rounded-full bg-blue-500/30 animate-ping" />
                  <div className="absolute inset-1 rounded-full bg-blue-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-blue-200">Esperando confirmación del móvil...</h3>
                  <p className="text-xs text-blue-100/70">Completa el pago en tu celular para continuar</p>
                </div>
              </div>
            </div>
          )}
          
          <div className="glass-checkout-card rounded-3xl p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Selecciona un método de pago
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
                    disabled={isPolling && method.id !== "qr"}
                    className={cn(
                      "glass-checkout-pill flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-medium transition-all duration-300",
                      isActive
                        ? "glass-checkout-pill-active text-foreground shadow-lg shadow-primary/20"
                        : "text-muted-foreground hover:text-foreground",
                      isPolling && method.id !== "qr" && "opacity-50 cursor-not-allowed"
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
              <CardPaymentForm
                amount={total}
                apiKey={merchantApiKey}
                resetTrigger={resetTrigger}
                onResult={handleTransactionResult}
              />
            )}
            {selectedMethod === "qr" && (
              <QRPaymentForm
                subtotal={subtotal}
                apiKey={merchantApiKey}
                resetTrigger={resetTrigger}
                onQrSessionCreated={handleQrSessionCreated}
                onResult={handleTransactionResult}
              />
            )}
            {selectedMethod === "crypto" && (
              <CryptoPaymentForm
                subtotal={subtotal}
                apiKey={merchantApiKey}
                resetTrigger={resetTrigger}
                onResult={handleTransactionResult}
              />
            )}
          </div>
        </div>

        <div className="animate-fade-in" style={{ animationDelay: "0.1s" }}>
          <OrderSummary
            subtotal={subtotal}
            taxRate={taxRate}
            taxAmount={taxAmount}
            total={total}
            selectedTax={selectedTax}
            onTaxChange={setSelectedTax}
            onSubtotalChange={setSubtotal}
            fraudResult={fraudResult}
            onNewTransaction={handleNewTransaction}
          />
        </div>
      </div>
    </div>
  );
}