"use client";

import { useSearchParams } from "next/navigation";
import { Users, CreditCard, DollarSign, Percent } from "lucide-react";
import DashboardHeader from "@/components/dashboard/header";
import StatCard from "@/components/dashboard/stat-card";
import OverviewChart from "@/components/dashboard/charts/overview-chart";
import TransactionsHourChart from "@/components/dashboard/charts/transactions-hour-chart";
import PaymentSummary from "@/components/dashboard/charts/payment-summary";
import CustomSelect from "@/components/checkout/custom-select";
import RevenueByLocation from "@/components/dashboard/charts/revenue-by-location";
import ConversionFunnel from "@/components/dashboard/charts/conversion-funnel";
import { useAuth } from "@/lib/auth-context";

import { useEffect, useMemo, useState } from "react";
import { fetchMerchants, fetchOverviewMetrics } from "@/lib/api";

type MerchantOption = {
  merchant_id: number;
  name: string;
};

export default function OverviewPage() {
  const { user: currentUser } = useAuth();
  const isSuperadmin = !!currentUser?.is_superadmin;

  const [overviewData, setOverviewData] = useState<any>(null);
  const [merchants, setMerchants] = useState<MerchantOption[]>([]);
  const [selectedMerchantId, setSelectedMerchantId] = useState<number | undefined>(undefined);

  const searchParams = useSearchParams();
  const deniedSection = searchParams.get("denied");
  const deniedMessage =
    deniedSection === "merchants"
      ? "Acceso denegado: solo los superadmins pueden acceder a Comercios."
      : deniedSection === "users"
      ? "Acceso denegado: solo admins o superadmins pueden acceder a Gestión de Usuarios."
      : deniedSection === "roles"
      ? "Acceso denegado: solo admins o superadmins pueden acceder a Roles de la Empresa."
      : null;

  const merchantOptions = useMemo(() => {
    const uniqueById = new Map<number, MerchantOption>();
    merchants.forEach((merchant) => {
      uniqueById.set(merchant.merchant_id, merchant);
    });

    return Array.from(uniqueById.values())
      .filter((merchant) => merchant.merchant_id !== 0)
      .sort((a, b) => a.merchant_id - b.merchant_id);
  }, [merchants]);

  useEffect(() => {
    if (!currentUser || !isSuperadmin) {
      setSelectedMerchantId(undefined);
      return;
    }
  }, [currentUser, isSuperadmin]);

  useEffect(() => {
    if (!isSuperadmin) return;

    setSelectedMerchantId((prev) => {
      if (prev !== undefined && merchantOptions.some((m) => m.merchant_id === prev)) {
        return prev;
      }

      return merchantOptions[0]?.merchant_id;
    });
  }, [isSuperadmin, merchantOptions]);

  useEffect(() => {
    if (!currentUser || !isSuperadmin) return;

    async function loadMerchants() {
      try {
        const data = await fetchMerchants();
        setMerchants(
          data.map((merchant) => ({
            merchant_id: merchant.merchant_id,
            name: merchant.name,
          }))
        );
      } catch (error) {
        console.error("Error loading merchants for dashboard", error);
      }
    }

    loadMerchants();
  }, [currentUser, isSuperadmin]);

  useEffect(() => {
    const load = async () => {
      const res = await fetchOverviewMetrics(
        undefined,
        isSuperadmin ? selectedMerchantId : undefined
      );
      if (res.data) {
        setOverviewData(res.data);
      }
    };

    if (isSuperadmin && selectedMerchantId === undefined) {
      return;
    }

    load();
  }, [isSuperadmin, selectedMerchantId]);

  return (
    <div className="flex flex-col min-h-screen">
      <DashboardHeader title="Overview" />

      <div className="flex-1 p-4 md:p-6 flex flex-col gap-5 stagger-children">
        {deniedMessage && (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
            {deniedMessage}
          </div>
        )}

        {isSuperadmin && (
          <div className="w-full max-w-[260px] animate-fade-in">
            <CustomSelect
              variant="dashboard"
              value={String(selectedMerchantId ?? "")}
              onChange={(value) => setSelectedMerchantId(Number(value))}
              placeholder="Selecciona un comercio"
              options={merchantOptions.map((merchant) => ({
                value: String(merchant.merchant_id),
                label: merchant.name,
              }))}
            />
          </div>
        )}

        {/* Tarjetas de estadísticas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 stagger-children">
          <StatCard
            label="Usuarios Activos"
            value={overviewData?.stats.total_users || 0}
            change={overviewData?.stats.users_change || 0}
            icon={Users}
            accent
          />
          <StatCard
            label="Transaccions Totales"
            value={overviewData?.stats.total_transactions || 0}
            change={overviewData?.stats.transactions_change || 0}
            icon={CreditCard}
          />
          <StatCard
            label="Monto Total de Transacciones"
            value={`$${overviewData?.stats.total_revenue.toLocaleString() || 0}`}
            change={overviewData?.stats.revenue_change || 0}
            icon={DollarSign}
            accent
          />
          <StatCard
            label="Porcentaje de Fraude"
            value={`${overviewData?.stats.fraud_rate || 0}%`}
            change={overviewData?.stats.fraud_change || 0}
            icon={Percent}
          />
        </div>

        {/* Gráfica principal */}
        <div className="animate-fade-in">
          <OverviewChart merchantId={isSuperadmin ? selectedMerchantId : undefined} />
        </div>

        {/* Fila inferior */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 animate-fade-in">
          <PaymentSummary merchantId={isSuperadmin ? selectedMerchantId : undefined} />
          <RevenueByLocation merchantId={isSuperadmin ? selectedMerchantId : undefined} />
        </div>

        {/* Resumen de pagos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 animate-fade-in">
          <ConversionFunnel merchantId={isSuperadmin ? selectedMerchantId : undefined} />
          <TransactionsHourChart merchantId={isSuperadmin ? selectedMerchantId : undefined} />
        </div>

        {/* Fila inferior */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 animate-fade-in">
          {/* <RevenueComparison />  */}
          {/* <LocationChart />    */}
        </div>
      </div>
    </div>
  );
}
