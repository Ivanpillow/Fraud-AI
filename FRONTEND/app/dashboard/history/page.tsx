"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Filter, CheckCircle2 } from "lucide-react";
import DashboardHeader from "@/components/dashboard/header";
import GlassCard from "@/components/dashboard/glass-card";
import TransactionRow from "@/components/dashboard/review/transaction-row";
import CustomSelect from "@/components/checkout/custom-select";
import { cn } from "@/lib/utils";
import { fetchFraudHistory } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

type PaymentMethodFilter = "all" | "card" | "qr" | "crypto";
type HistoryStatusFilter = "all" | "allow" | "block";

interface HistoryTransaction {
  id: string;
  prediction_id: number;
  transaction_id: number;
  channel: "card" | "qr" | "crypto";
  status: "allow" | "block" | "review";
  amount: number;
  fraud_probability: number;
  timestamp: string;
  message: string;
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

export default function HistoryPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const isSuperadmin = !!user?.is_superadmin;
  const [statusFilter, setStatusFilter] = useState<HistoryStatusFilter>("all");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<PaymentMethodFilter>("all");
  const [transactions, setTransactions] = useState<HistoryTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated && isSuperadmin) {
      router.replace("/dashboard");
      return;
    }

    async function loadHistory() {
      if (isAuthenticated) {
        const res = await fetchFraudHistory();
        if (res.data) {
          const txns = res.data.map(notif => ({
            id: notif.id,
            prediction_id: notif.prediction_id,
            transaction_id: notif.transaction_id,
            channel: (notif.channel === "blockchain" ? "crypto" : notif.channel) as "card" | "qr" | "crypto",
            status: ((notif.final_decision ?? notif.type) === "allow"
              ? "allow"
              : (notif.final_decision ?? notif.type) === "block"
                ? "block"
                : "review") as "allow" | "block" | "review",
            amount: notif.amount,
            fraud_probability: notif.fraud_probability,
            timestamp: notif.timestamp,
            message: notif.message,
            decision: notif.decision,
            final_decision: notif.final_decision,
            reviewed: notif.reviewed,
            shipping_country: notif.shipping_country,
            shipping_state: notif.shipping_state,
            shipping_city: notif.shipping_city,
            shipping_postal_code: notif.shipping_postal_code,
            shipping_street: notif.shipping_street,
            shipping_reference: notif.shipping_reference,
            shipping_full_name: notif.shipping_full_name,
            shipping_phone: notif.shipping_phone,
            explanations: notif.explanations || [],
          }));
          setTransactions(txns);
        }
      }
      setIsLoading(false);
    }
    loadHistory();
  }, [isAuthenticated, isSuperadmin, router]);

  if (isSuperadmin) {
    return null;
  }

  const filteredByStatus =
    statusFilter === "all"
      ? transactions
      : transactions.filter((t) => t.status === statusFilter);

  const filtered =
    paymentMethodFilter === "all"
      ? filteredByStatus
      : filteredByStatus.filter((t) => t.channel === paymentMethodFilter);

  const counts = {
    all: transactions.length,
    allow: transactions.filter((t) => t.status === "allow").length,
    block: transactions.filter((t) => t.status === "block").length,
  };

  const filters: { key: HistoryStatusFilter; label: string }[] = [
    { key: "all", label: "Todas" },
    { key: "allow", label: "Aprobadas" },
    { key: "block", label: "Bloqueadas" },
  ];

  const paymentMethodOptions = [
    { value: "all", label: "Todos los métodos" },
    { value: "card", label: "Tarjeta" },
    { value: "qr", label: "QR" },
    { value: "crypto", label: "Crypto" },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <DashboardHeader title="Historial de Transacciones" breadcrumb="Historial Procesado" />

      <div className="flex-1 p-4 md:p-6 flex flex-col gap-5">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 stagger-children">
              <GlassCard>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                    Total Procesadas
                  </p>
                  <p className="text-2xl font-bold text-foreground">
                    {counts.all}
                  </p>
                </div>
              </GlassCard>
              <GlassCard>
                <div className="text-center">
                  <p className="text-xs text-emerald-500 uppercase tracking-wider mb-1">
                    Aprobadas
                  </p>
                  <p className="text-2xl font-bold text-foreground">
                    {counts.allow}
                  </p>
                </div>
              </GlassCard>
              <GlassCard>
                <div className="text-center">
                  <p className="text-xs text-destructive uppercase tracking-wider mb-1">
                    Bloqueadas
                  </p>
                  <p className="text-2xl font-bold text-foreground">
                    {counts.block}
                  </p>
                </div>
              </GlassCard>
            </div>

            {/* Filtros */}
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="w-full md:w-[200px]">
                <CustomSelect
                  value={paymentMethodFilter}
                  onChange={(value) => setPaymentMethodFilter(value as PaymentMethodFilter)}
                  options={paymentMethodOptions}
                  placeholder="Método de pago"
                  variant="dashboard"
                />
              </div>

              <div className="flex items-center gap-3">
                <Filter size={16} className="text-muted-foreground" />
                <div className="flex items-center rounded-xl glass p-1 gap-0.5">
                  {filters.map((f) => (
                    <button
                      key={f.key}
                      onClick={() => setStatusFilter(f.key)}
                      className={cn(
                        "flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-xs font-medium transition-all duration-200",
                        "active:scale-[0.95]",
                        statusFilter === f.key
                          ? "bg-primary/15 text-primary shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {f.label}
                      <span className="text-[10px] opacity-60">
                        ({counts[f.key]})
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Lista de transacciones */}
            <div className="flex flex-col gap-2 stagger-children">
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <CheckCircle2 size={48} className="mb-3 opacity-30" />
                  <p className="text-sm">No hay transacciones en este filtro</p>
                </div>
              ) : (
                filtered.map((txn) => (
                  <div key={txn.id}>
                    <TransactionRow
                      transaction={txn as any}
                      onAction={() => {}} // No permite editar en historial
                      isHistory={true}
                    />
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
