"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle, ArrowLeft, CheckCircle2, Loader2, ShieldCheck, Wallet } from "lucide-react";
import { API_BASE_URL } from "@/lib/api";
import { readHttpErrorMessage } from "@/lib/utils";
import { navigateToFraudResult } from "@/lib/fraud-result-routing";

function formatMoney(value: number, currency = "MXN"): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}

function parseNumber(value: string | null): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

type WalletOption = {
  label: string;
  name: string;
  exampleAddress: string;
};

const WALLET_OPTIONS: WalletOption[] = [
  { label: "Coinbase Wallet", name: "coinbase_wallet", exampleAddress: "cb1q9n0q7h5m3x8v2t7demo0001" },
  { label: "MetaMask", name: "metamask", exampleAddress: "0x8F3a9d7eA1bB4C2d5E6f7A8b9C0d1e2F3a4B5C6D" },
  { label: "Trust Wallet", name: "trust_wallet", exampleAddress: "trust1q8l3k2p9m4n7d6s5a4demo0002" },
  { label: "Ledger", name: "ledger", exampleAddress: "ledger1q6v5b4n3m2k1j0h9g8demo0003" },
];

export default function BcPayPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const paymentId = parseNumber(searchParams.get("paymentId"));
  const returnUrl = searchParams.get("returnUrl") ?? "/checkout";

  const [order, setOrder] = useState<{
    payment_id: number;
    provider: string;
    provider_reference: string;
    status: string;
    status_reason?: string | null;
    amount: number;
    fiat_currency: string;
    asset_symbol: string;
    network: string;
    wallet_address?: string | null;
    tx_hash?: string | null;
    shipping_country?: string | null;
    shipping_state?: string | null;
    shipping_city?: string | null;
    shipping_postal_code?: string | null;
    shipping_street?: string | null;
    shipping_reference?: string | null;
    shipping_full_name?: string | null;
    shipping_phone?: string | null;
    fraud_result?: {
      transaction_id: number;
      fraud_probability: number;
      decision: string;
      model_scores: Record<string, number>;
      explanations?: unknown;
    } | null;
  } | null>(null);
  const [selectedWallet, setSelectedWallet] = useState<WalletOption>(WALLET_OPTIONS[0]);
  const [walletAddress, setWalletAddress] = useState(WALLET_OPTIONS[0].exampleAddress);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [polling, setPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canConfirm = Boolean(paymentId && walletAddress.trim().length > 0 && order && order.status === "pending");

  const loadOrder = async () => {
    if (!paymentId) {
      setError("Falta el identificador del pago.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/bc-transactions/${paymentId}`, {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(await readHttpErrorMessage(response));
      }

      const payload = await response.json();
      setOrder(payload);
      if (payload.wallet_address) {
        setWalletAddress(payload.wallet_address);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "No se pudo recuperar la orden de pago.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadOrder();
  }, [paymentId]);

  useEffect(() => {
    if (!selectedWallet) return;
    setWalletAddress(selectedWallet.exampleAddress);
  }, [selectedWallet]);

  useEffect(() => {
    if (!polling || !paymentId) return;

    const timer = window.setInterval(async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/bc-transactions/${paymentId}`, {
          method: "GET",
          credentials: "include",
        });

        if (!response.ok) return;

        const payload = await response.json();
        setOrder(payload);

        if (payload.status === "confirmed" || payload.status === "failed") {
          window.clearInterval(timer);
          setPolling(false);

          if (payload.fraud_result) {
            navigateToFraudResult(payload.fraud_result, returnUrl);
          }
        }
      } catch {
        // keep polling silently
      }
    }, 1200);

    return () => window.clearInterval(timer);
  }, [polling, paymentId, returnUrl]);

  const handleConfirmPayment = async () => {
    if (!paymentId || !canConfirm) return;

    setConfirming(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/bc-transactions/${paymentId}/simulate-payment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          wallet_address: walletAddress.trim(),
          wallet_name: selectedWallet.label,
        }),
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(await readHttpErrorMessage(response));
      }

      const payload = await response.json();
      setOrder(payload);
      setPolling(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "No se pudo simular el pago.");
    } finally {
      setConfirming(false);
    }
  };

  const destinationAddress = order?.provider_reference ?? "—";

  return (
    <main className="min-h-screen px-4 py-6 md:px-8 md:py-10">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <section className="glass-card rounded-3xl p-6 md:p-8">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => router.push(returnUrl)}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-muted-foreground transition-all hover:bg-white/10 hover:text-foreground"
            >
              <ArrowLeft size={14} /> Volver
            </button>
            <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-muted-foreground">
              {paymentId ? `Pago #${paymentId}` : "Pago cripto"}
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-2">
            <p className="text-xs uppercase tracking-[0.25em] text-primary/90">Pago cripto simulado</p>
            <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              Confirmación de pago
            </h1>
            <p className="text-sm text-muted-foreground md:text-base">
              Recupera la orden por ID, selecciona tu wallet simulada y confirma el pago.
            </p>
          </div>
        </section>

        {loading ? (
          <section className="glass-card rounded-3xl p-6 md:p-8">
            <div className="flex items-center gap-3 text-muted-foreground">
              <Loader2 size={18} className="animate-spin" />
              Recuperando orden...
            </div>
          </section>
        ) : error ? (
          <section className="glass-card rounded-3xl p-6 md:p-8">
            <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
              {error}
            </div>
          </section>
        ) : order ? (
          <section className="glass-card rounded-3xl p-6 md:p-8 space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Monto</p>
                <p className="mt-1 text-2xl font-bold text-foreground">{formatMoney(order.amount, order.fiat_currency)}</p>
                <p className="mt-2 text-xs text-muted-foreground">Moneda: {order.asset_symbol} en {order.network}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Dirección de destino</p>
                <p className="mt-1 break-all text-sm font-semibold text-foreground">{destinationAddress}</p>
                <p className="mt-2 text-xs text-muted-foreground">La wallet del usuario se asigna al confirmar.</p>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Wallet size={16} className="text-primary" />
                <h2 className="text-sm font-semibold text-foreground">Selecciona tu wallet</h2>
              </div>
              <div className="grid gap-2 md:grid-cols-2">
                {WALLET_OPTIONS.map((wallet) => {
                  const active = selectedWallet.name === wallet.name;
                  return (
                    <button
                      key={wallet.name}
                      type="button"
                      onClick={() => setSelectedWallet(wallet)}
                      className={[
                        "rounded-2xl border p-3 text-left transition-all",
                        active
                          ? "border-primary/60 bg-primary/15"
                          : "border-white/10 bg-white/[0.03] hover:bg-white/5",
                      ].join(" ")}
                    >
                      <p className="text-sm font-semibold text-foreground">{wallet.label}</p>
                      <p className="mt-1 text-xs text-muted-foreground break-all">{wallet.exampleAddress}</p>
                    </button>
                  );
                })}
              </div>

              <div>
                <label className="checkout-label">Dirección de wallet</label>
                <input
                  type="text"
                  value={walletAddress}
                  onChange={(e) => setWalletAddress(e.target.value)}
                  className="checkout-input font-mono text-sm"
                  placeholder={selectedWallet.exampleAddress}
                  disabled={confirming || polling}
                />
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/10 p-4 space-y-2 text-sm">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Detalles de la orden</p>
              <p className="text-foreground">Estado: <span className="font-semibold">{order.status}</span></p>
              <p className="text-foreground">Referencia: <span className="font-semibold break-all">{order.provider_reference}</span></p>
              <p className="text-foreground">Nombre: <span className="font-semibold">{order.shipping_full_name ?? "—"}</span></p>
              <p className="text-foreground">Envío: <span className="font-semibold">{[order.shipping_street, order.shipping_city, order.shipping_state, order.shipping_country].filter(Boolean).join(", ")}</span></p>
            </div>

            {error && (
              <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
                {error}
              </div>
            )}

            {order.fraud_result ? (
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4">
                <div className="flex items-center gap-2 text-emerald-200">
                  <CheckCircle2 size={18} />
                  <span className="font-semibold">Pago procesado</span>
                </div>
                <p className="mt-2 text-sm text-emerald-100/90">
                  La transacción {order.fraud_result.transaction_id} fue evaluada con decisión {order.fraud_result.decision}.
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => navigateToFraudResult(order.fraud_result!, returnUrl)}
                    className="rounded-2xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                  >
                    Ver resultado
                  </button>
                  <button
                    type="button"
                    onClick={() => router.push(returnUrl)}
                    className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground"
                  >
                    Volver a la tienda
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleConfirmPayment}
                disabled={!canConfirm || confirming || polling}
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-primary-foreground transition-all hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {confirming ? (
                  <>
                    <Loader2 size={18} className="animate-spin" /> Simulando pago...
                  </>
                ) : polling ? (
                  <>
                    <ShieldCheck size={18} /> Esperando antifraude...
                  </>
                ) : (
                  <>
                    <ShieldCheck size={18} /> Confirmar pago simulado
                  </>
                )}
              </button>
            )}
          </section>
        ) : null}
      </div>
    </main>
  );
}
