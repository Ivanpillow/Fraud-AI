"use client";

import { useSearchParams } from "next/navigation";
import { Users, CreditCard, DollarSign, Percent } from "lucide-react";
import DashboardHeader from "@/components/dashboard/header";
import StatCard from "@/components/dashboard/stat-card";
import OverviewChart from "@/components/dashboard/charts/overview-chart";
import LocationChart from "@/components/dashboard/charts/location-chart";
import TransactionsHourChart from "@/components/dashboard/charts/transactions-hour-chart";
import PaymentSummary from "@/components/dashboard/charts/payment-summary";
import { mockStats } from "@/lib/mock-data";
import RevenueByLocation from "@/components/dashboard/charts/revenue-by-location";
import ConversionFunnel from "@/components/dashboard/charts/conversion-funnel";
import RevenueComparison from "@/components/dashboard/charts/revenue-comparison";

import { useEffect, useState } from "react";
import { fetchOverviewMetrics } from "@/lib/api";

export default function OverviewPage() {
  const [overviewData, setOverviewData] = useState<any>(null);
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

  useEffect(() => {
    const load = async () => {
      const res = await fetchOverviewMetrics();
      if (res.data) {
        setOverviewData(res.data);
      }
    };
    load();
  }, []);
  return (
    <div className="flex flex-col min-h-screen">
      <DashboardHeader title="Overview" />

      <div className="flex-1 p-4 md:p-6 flex flex-col gap-5 stagger-children">
        {deniedMessage && (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
            {deniedMessage}
          </div>
        )}

        {/* Stat Cards */}
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

        {/* Main Chart */}
        <div className="animate-fade-in">
          <OverviewChart />
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 animate-fade-in">
          <PaymentSummary />
          <RevenueByLocation />
        </div>

        {/* Payment Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 animate-fade-in">
          <ConversionFunnel />
          <TransactionsHourChart />
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 animate-fade-in">
          {/* <RevenueComparison />  */}
          {/* <LocationChart />    */}
        </div>
      </div>
    </div>
  );
}
