"use client";

import React, { useState } from "react";
import { CreditCard } from "lucide-react";

interface QrCardFormProps {
  onAdd: (payload: { label: string; cardNumber: string }) => Promise<void> | void;
  disabled?: boolean;
  compact?: boolean;
  useFormTag?: boolean;
}

function formatCardNumber(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 19);
  return digits.replace(/(\d{4})(?=\d)/g, "$1 ");
}

function formatExpiry(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) {
    return digits;
  }
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

function normalizeCardNumber(value: string) {
  return value.replace(/\D/g, "");
}

export function QrCardForm({ onAdd, disabled, compact, useFormTag = true }: QrCardFormProps) {
  const [label, setLabel] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event?: React.FormEvent) => {
    event?.preventDefault();
    const normalized = normalizeCardNumber(cardNumber);

    if (!label.trim()) {
      setError("Agrega un nombre para la tarjeta.");
      return;
    }

    if (normalized.length < 12 || normalized.length > 19) {
      setError("Numero de tarjeta invalido.");
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      await onAdd({ label: label.trim(), cardNumber: normalized });
      setLabel("");
      setCardNumber("");
      setExpiry("");
      setCvv("");
    } catch {
      setError("No se pudo agregar la tarjeta.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const buttonType = useFormTag ? "submit" : "button";
  const content = (
    <div className={compact ? "grid gap-3" : "grid gap-4"}>
      <div className="grid gap-2">
        <label className="text-xs uppercase tracking-wide text-muted-foreground">Nombre de la tarjeta</label>
        <input
          value={label}
          onChange={(event) => setLabel(event.target.value)}
          placeholder="Personal o corporativa"
          className="h-11 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-foreground outline-none transition focus:border-primary/60"
          disabled={disabled || isSubmitting}
        />
      </div>
      <div className="grid gap-2">
        <label className="text-xs uppercase tracking-wide text-muted-foreground">Numero</label>
        <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2">
          <CreditCard size={16} className="text-muted-foreground" />
          <input
            value={cardNumber}
            onChange={(event) => setCardNumber(formatCardNumber(event.target.value))}
            placeholder="4242 4242 4242 4242"
            className="w-full bg-transparent text-sm text-foreground outline-none"
            disabled={disabled || isSubmitting}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-2">
          <label className="text-xs uppercase tracking-wide text-muted-foreground">Expira</label>
          <input
            value={expiry}
            onChange={(event) => setExpiry(formatExpiry(event.target.value))}
            placeholder="MM/AA"
            className="h-11 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-foreground outline-none transition focus:border-primary/60"
            disabled={disabled || isSubmitting}
          />
        </div>
        <div className="grid gap-2">
          <label className="text-xs uppercase tracking-wide text-muted-foreground">CVV</label>
          <input
            value={cvv}
            onChange={(event) => setCvv(event.target.value.replace(/\D/g, "").slice(0, 4))}
            placeholder="123"
            className="h-11 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-foreground outline-none transition focus:border-primary/60"
            disabled={disabled || isSubmitting}
          />
        </div>
      </div>
      {error && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-200">
          {error}
        </div>
      )}
      <button
        type={buttonType}
        onClick={useFormTag ? undefined : () => void handleSubmit()}
        disabled={disabled || isSubmitting}
        className="inline-flex h-11 w-full items-center justify-center rounded-2xl bg-primary text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "Agregando..." : "Agregar tarjeta"}
      </button>
    </div>
  );

  if (!useFormTag) {
    return content;
  }

  return (
    <form onSubmit={handleSubmit} className={compact ? "grid gap-3" : "grid gap-4"}>
      {content}
    </form>
  );
}
