"use client";

import { useState } from "react";
import {
  ShieldCheck,
  ShieldX,
  Clock,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { updateNotificationDecision } from "@/lib/api";

interface Transaction {
  id: string;
  prediction_id: number;
  amount: number;
  status: "block" | "review" | "clean";
  user_email?: string;
  timestamp: string;
  reason?: string;
  location?: string;
  message?: string;
  fraud_probability?: number;
  channel?: string;
  transaction_id?: number;
}

interface TransactionRowProps {
  transaction: Transaction;
  onAction: (id: string) => void;
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
}: TransactionRowProps) {
  const [expanded, setExpanded] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const handleAction = async (action: "approve" | "block" | "review") => {
    setActionLoading(action);
    try {
      // Llamar al backend para actualizar la decisión
      const result = await updateNotificationDecision(
        tx.prediction_id,
        action
      );
      
      if (result.data) {
        // Si la actualización fue exitosa, notificar al padre para remover de la lista
        onAction(tx.id);
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
                  : "bg-[hsl(var(--warning))]/10 text-[hsl(var(--warning))]"
              )}
            >
              {tx.status === "block" ? "Bloqueada" : "En Revisión"}
            </span>
          </div>
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            {tx.message || `Canal: ${tx.channel?.toUpperCase() || "N/A"}`}
          </p>
        </div>

        {/* Amount */}
        <span className="text-lg font-bold font-mono text-foreground">
          ${tx.amount.toLocaleString()}
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

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleAction("approve")}
              disabled={actionLoading !== null}
              className="flex items-center gap-1.5 rounded-lg bg-primary/10 px-4 py-2 text-xs font-medium text-primary hover:bg-primary/20 transition-all active:scale-[0.97] disabled:opacity-50"
            >
              {actionLoading === "approve" ? (
                <span className="h-3 w-3 animate-spin rounded-full border border-primary border-t-transparent" />
              ) : (
                <ShieldCheck size={14} />
              )}
              Aprobar
            </button>
            <button
              onClick={() => handleAction("review")}
              disabled={actionLoading !== null}
              className="flex items-center gap-1.5 rounded-lg bg-[hsl(var(--warning))]/10 px-4 py-2 text-xs font-medium text-[hsl(var(--warning))] hover:bg-[hsl(var(--warning))]/20 transition-all active:scale-[0.97] disabled:opacity-50"
            >
              {actionLoading === "review" ? (
                <span className="h-3 w-3 animate-spin rounded-full border border-[hsl(var(--warning))] border-t-transparent" />
              ) : (
                <Clock size={14} />
              )}
              En Revisión
            </button>
            <button
              onClick={() => handleAction("block")}
              disabled={actionLoading !== null}
              className="flex items-center gap-1.5 rounded-lg bg-destructive/10 px-4 py-2 text-xs font-medium text-destructive hover:bg-destructive/20 transition-all active:scale-[0.97] disabled:opacity-50"
            >
              {actionLoading === "block" ? (
                <span className="h-3 w-3 animate-spin rounded-full border border-destructive border-t-transparent" />
              ) : (
                <ShieldX size={14} />
              )}
              Rechazar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
