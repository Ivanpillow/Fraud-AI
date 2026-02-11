"use client";

import { useState } from "react";
import {
  ShieldCheck,
  ShieldX,
  MapPin,
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
  onAction: (id: string, action: "approve" | "block") => void;
  token?: string;
}

function formatDate(ts: string): string {
  try {
    const date = new Date(ts);
    return date.toLocaleDateString("en-US", {
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
  token,
}: TransactionRowProps) {
  const [expanded, setExpanded] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const handleAction = async (action: "approve" | "block") => {
    setActionLoading(action);
    try {
      // Llamar al backend para actualizar la decisión
      const result = await updateNotificationDecision(
        tx.prediction_id,
        action,
        token
      );
      
      if (result.data) {
        // Si la actualización fue exitosa, notificar al padre para remover de la lista
        onAction(tx.id, action);
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
              {tx.status}
            </span>
          </div>
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            {tx.user_email}
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
              <MapPin size={12} />
              <span>{tx.location}</span>
            </div>
          </div>

          <div className="glass rounded-lg p-3 mb-4">
            <p className="text-xs text-muted-foreground">
              <span className="text-foreground font-medium">Reason: </span>
              {tx.reason}
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
              Approve
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
              Block
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
