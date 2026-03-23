"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { Filter } from "lucide-react";
import DashboardHeader from "@/components/dashboard/header";
import GlassCard from "@/components/dashboard/glass-card";
import TransactionRow from "@/components/dashboard/review/transaction-row";
import { cn } from "@/lib/utils";
import { fetchNotifications } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

type StatusFilter = "all" | "block" | "review";

interface Transaction {
  id: string;
  prediction_id: number;
  transaction_id: number;
  channel: string;
  status: "block" | "review";
  amount: number;
  fraud_probability: number;
  timestamp: string;
  message: string;
}

export default function ReviewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, user } = useAuth();
  const isSuperadmin = !!user?.is_superadmin;
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  // Obtener transacción específica de parámetros
  const specifiedTransactionId = searchParams.get("transaction_id");
  const specifiedChannel = searchParams.get("channel");

  useEffect(() => {
    if (isAuthenticated && isSuperadmin) {
      router.replace("/dashboard");
      return;
    }

    async function loadTransactions() {
      if (isAuthenticated) {
        const res = await fetchNotifications();
        if (res.data) {
          const txns = res.data.map(notif => ({
            id: notif.id,
            prediction_id: notif.prediction_id,
            transaction_id: notif.transaction_id,
            channel: notif.channel,
            status: notif.type as "block" | "review",
            amount: notif.amount,
            fraud_probability: notif.fraud_probability,
            timestamp: notif.timestamp,
            message: notif.message,
          }));
          setTransactions(txns);

          // Si hay una transacción específica se destaca y se filtra por su estado
          if (specifiedTransactionId && specifiedChannel) {
            setHighlightedId(`${specifiedChannel}-${specifiedTransactionId}`);
            const txn = txns.find(t => t.transaction_id === parseInt(specifiedTransactionId));
            if (txn) {
              setFilter(txn.status === "block" ? "block" : "review");
            }
          }
        }
      }
      setIsLoading(false);
    }
    loadTransactions();
  }, [isAuthenticated, isSuperadmin, specifiedTransactionId, specifiedChannel, router]);

  if (isSuperadmin) {
    return null;
  }

  const filtered =
    filter === "all"
      ? transactions
      : transactions.filter((t) => t.status === filter);

  const counts = {
    all: transactions.length,
    review: transactions.filter((t) => t.status === "review").length,
    block: transactions.filter((t) => t.status === "block").length,
  };

  const handleAction = (id: string) => {
    setTransactions((prev) =>
      prev.filter((t) => t.id !== id)
    );
  };

  const filters: { key: StatusFilter; label: string }[] = [
    { key: "all", label: "Todas" },
    { key: "review", label: "En Revisión" },
    { key: "block", label: "Bloqueadas" },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <DashboardHeader title="Revisar Transacciones" breadcrumb="Revisión de Fraude" />

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
                    Total Señaladas
                  </p>
                  <p className="text-2xl font-bold text-foreground">
                    {counts.all}
                  </p>
                </div>
              </GlassCard>
              <GlassCard>
                <div className="text-center">
                  <p className="text-xs text-[hsl(var(--warning))] uppercase tracking-wider mb-1">
                    En Revisión
                  </p>
                  <p className="text-2xl font-bold text-foreground">
                    {counts.review}
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
            <div className="flex items-center gap-3">
              <Filter size={16} className="text-muted-foreground" />
              <div className="flex items-center rounded-xl glass p-1 gap-0.5">
                {filters.map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setFilter(f.key)}
                    className={cn(
                      "flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-xs font-medium transition-all duration-200",
                      "active:scale-[0.95]",
                      filter === f.key
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

            {/* Lista de transacciones */}
            <div className="flex flex-col gap-2 stagger-children">
              {filtered.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <p className="text-sm">No hay transacciones en este filtro</p>
                </div>
              ) : (
                filtered.map((txn) => (
                  <div
                    key={txn.id}
                    className={cn(
                      "transition-all duration-200",
                      highlightedId === txn.id && "ring-2 ring-primary rounded-xl"
                    )}
                  >
                    <TransactionRow
                      transaction={txn}
                      onAction={handleAction}
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

