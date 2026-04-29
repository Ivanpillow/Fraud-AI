"use client";

import { useState } from "react";
import {
  ShieldCheck,
  ShieldX,
  Clock,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { cn, formatCurrencyMXN } from "@/lib/utils";
import { updateNotificationDecision } from "@/lib/api";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Transaction {
  id: string;
  prediction_id: number;
  amount: number;
  status: "block" | "review" | "allow" | "clean";
  user_email?: string;
  timestamp: string;
  reason?: string;
  location?: string;
  message?: string;
  fraud_probability?: number;
  channel?: string;
  transaction_id?: number;
  decision?: string | null;
  final_decision?: string | null;
  reviewed?: boolean;
  shipping_country?: string | null;
  shipping_state?: string | null;
  shipping_city?: string | null;
  shipping_postal_code?: string | null;
  shipping_street?: string | null;
  shipping_reference?: string | null;
  shipping_full_name?: string | null;
  shipping_phone?: string | null;
  explanations?: Array<{
    feature_name?: string;
    contribution_value?: number;
    direction?: string;
  }>;
}

interface TransactionRowProps {
  transaction: Transaction;
  onAction: (id: string, action: "approve" | "block" | "review") => void;
  isHistory?: boolean; // Si es True, no muestra botones de acción
}

const FEATURE_LABELS: Record<string, string> = {
  amount: "Monto",
  amount_vs_avg: "Monto vs promedio del usuario",
  transactions_last_24h: "Transacciones en 24h",
  card_tx_last_24h: "Transacciones con tarjeta en 24h",
  qr_tx_last_24h: "Transacciones QR en 24h",
  hour: "Hora de la transacción",
  day_of_week: "Día de la semana",
  failed_attempts: "Intentos fallidos",
  is_international: "Operación internacional",
};

function toFeatureLabel(featureName?: string): string {
  if (!featureName) return "Factor desconocido";
  return FEATURE_LABELS[featureName] || featureName.replaceAll("_", " ");
}

function formatContribution(value?: number): string {
  const numericValue = typeof value === "number" ? value : 0;
  const sign = numericValue > 0 ? "+" : "";
  return `${sign}${numericValue.toFixed(4)}`;
}

function formatDate(ts: string): string {
  try {
    const date = new Date(ts);
    return date.toLocaleDateString("es-MX", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return ts;
  }
}

export default function TransactionRow({
  transaction: tx,
  onAction,
  isHistory = false,
}: TransactionRowProps) {
  const [expanded, setExpanded] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<"approve" | "block" | null>(null);
  const topExplanations = (tx.explanations || []).slice(0, 4);
  const shippingFields = [
    ["País", tx.shipping_country],
    ["Estado", tx.shipping_state],
    ["Ciudad", tx.shipping_city],
    ["Código postal", tx.shipping_postal_code],
    ["Calle", tx.shipping_street],
    ["Referencia", tx.shipping_reference],
    ["Nombre", tx.shipping_full_name],
    ["Teléfono", tx.shipping_phone],
  ].filter(([, value]) => Boolean(value));
  const isSystemApproved = isHistory && tx.final_decision === "allow" && tx.decision === "allow";
  const statusLabel = tx.status === "block"
    ? "Bloqueada"
    : isHistory
      ? isSystemApproved
        ? "Aprobada por el sistema"
        : tx.status === "allow"
          ? "Aprobada"
          : "Revisada"
      : "En Revisión";

  const handleAction = async (action: "approve" | "block" | "review") => {
    setActionLoading(action);
    try {
      // Llamar al backend para actualizar la decisión
      const result = await updateNotificationDecision(
        tx.prediction_id,
        action
      );
      
      if (result.data) {
        // Si la actualización fue exitosa, notificar al padre para sincronizar estado local
        onAction(tx.id, action);
        window.dispatchEvent(new CustomEvent("fraud-decision-updated"));
      } else {
        console.error("Error updating decision:", result.error);
        alert("Error al actualizar la decisión. Por favor intenta de nuevo.");
      }
    } catch (error) {
      console.error("Error updating decision:", error);
      alert("Error al actualizar la decisión. Por favor intenta de nuevo.");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div
      className={cn(
        "glass-card rounded-xl overflow-hidden transition-all duration-200",
        tx.status === "block" && "border-destructive/20"
      )}
    >
      {/* Main Row */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-3 w-full p-4 text-left hover:bg-white/[0.02] transition-colors"
      >
        {/* Status Indicator */}
        <div
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
            tx.status === "block"
              ? "bg-destructive/10 text-destructive"
              : isHistory
                ? "bg-emerald-500/10 text-emerald-500"
                : "bg-[hsl(var(--warning))]/10 text-[hsl(var(--warning))]"
          )}
        >
          {tx.status === "block" ? (
            <ShieldX size={16} />
          ) : (
            <ShieldCheck size={16} />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-mono font-medium text-foreground">
              {tx.id}
            </span>
            <span
              className={cn(
                "text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full",
                tx.status === "block"
                  ? "bg-destructive/10 text-destructive"
                  : isHistory
                    ? "bg-emerald-500/10 text-emerald-500"
                    : "bg-[hsl(var(--warning))]/10 text-[hsl(var(--warning))]"
              )}
            >
              {statusLabel}
            </span>
          </div>
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            {tx.message || `Canal: ${tx.channel?.toUpperCase() || "N/A"}`}
          </p>
        </div>

        {/* Amount */}
        <span className="text-lg font-bold font-mono text-foreground">
          {formatCurrencyMXN(tx.amount)}
        </span>

        {/* Expand */}
        <div className="text-muted-foreground">
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>

      {/* Expanded Details */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-white/5 pt-3 animate-fade-in">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock size={12} />
              <span>{formatDate(tx.timestamp)}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="font-medium">Probabilidad:</span>
              <span className="text-foreground font-mono">
                {((tx.fraud_probability || 0) * 100).toFixed(1)}%
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="font-medium">Canal:</span>
              <span className="text-foreground uppercase">
                {tx.channel || "N/A"}
              </span>
            </div>
          </div>

          <div className="glass rounded-lg p-3 mb-4">
            <p className="text-xs text-muted-foreground">
              <span className="text-foreground font-medium">Mensaje: </span>
              {tx.message || "Transacción sospechosa detectada"}
            </p>
          </div>

          {shippingFields.length > 0 && (
            <div className="glass rounded-lg p-3 mb-4">
              <p className="text-xs text-foreground font-medium mb-2">
                Dirección de envío:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-muted-foreground">
                {shippingFields.map(([label, value]) => (
                  <div key={`${tx.id}-${label}`} className="rounded-md border border-white/5 bg-white/[0.02] px-3 py-2">
                    <span className="text-foreground/80">{label}:</span> {value}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="glass rounded-lg p-3 mb-4">
            <p className="text-xs text-foreground font-medium mb-2">
              Factores relevantes de la predicción:
            </p>
            {topExplanations.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Sin factores registrados para esta transacción.
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {topExplanations.map((exp, idx) => {
                  const direction = (exp.direction || "").toLowerCase();
                  const isIncrease = direction === "increase";

                  return (
                    <div key={`${tx.id}-exp-${idx}`} className="flex items-center justify-between gap-3 text-xs">
                      <span className="text-muted-foreground truncate">
                        {toFeatureLabel(exp.feature_name)}
                      </span>
                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[10px] uppercase",
                            isIncrease
                              ? "bg-destructive/10 text-destructive"
                              : "bg-emerald-500/10 text-emerald-400"
                          )}
                        >
                          {isIncrease ? "Aumenta Riesgo" : "Reduce Riesgo"}
                        </span>
                        <span className="font-mono text-foreground">
                          {formatContribution(exp.contribution_value)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {!isHistory && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPendingAction("approve")}
                disabled={actionLoading !== null}
                className="flex items-center gap-1.5 rounded-lg bg-primary/10 px-4 py-2 text-xs font-medium text-primary hover:bg-primary/20 transition-all active:scale-[0.97] disabled:opacity-50"
              >
                <ShieldCheck size={14} />
                Aprobar
              </button>
              <button
                onClick={() => setPendingAction("block")}
                disabled={actionLoading !== null}
                className="flex items-center gap-1.5 rounded-lg bg-destructive/10 px-4 py-2 text-xs font-medium text-destructive hover:bg-destructive/20 transition-all active:scale-[0.97] disabled:opacity-50"
              >
                <ShieldX size={14} />
                Bloquear
              </button>
            </div>
          )}
        </div>
      )}

      <AlertDialog open={!!pendingAction} onOpenChange={(open) => !open && setPendingAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingAction === "approve" ? "Confirmar aprobación" : "Confirmar bloqueo"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingAction === "approve"
                ? "La transacción se aprobará y saldrá de las alertas pendientes."
                : "La transacción se bloqueará y saldrá de las alertas pendientes."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading !== null}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={actionLoading !== null}
              className={cn(
                pendingAction === "approve"
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "bg-destructive text-destructive-foreground hover:bg-destructive/90"
              )}
              onClick={(event) => {
                event.preventDefault();
                if (pendingAction) {
                  const action = pendingAction;
                  setPendingAction(null);
                  void handleAction(action);
                }
              }}
            >
              {actionLoading === pendingAction ? (
                <span className="h-3 w-3 animate-spin rounded-full border border-current border-t-transparent" />
              ) : pendingAction === "approve" ? (
                "Sí, aprobar"
              ) : (
                "Sí, bloquear"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
