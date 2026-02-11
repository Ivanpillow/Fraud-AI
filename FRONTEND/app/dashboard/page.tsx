"use client";

import { Users, CreditCard, DollarSign, Activity } from "lucide-react";
import DashboardHeader from "@/components/dashboard/header";
import StatCard from "@/components/dashboard/stat-card";
import OverviewChart from "@/components/dashboard/overview-chart";
import LocationChart from "@/components/dashboard/location-chart";
import TransactionsHourChart from "@/components/dashboard/transactions-hour-chart";
import PaymentSummary from "@/components/dashboard/payment-summary";
import { mockStats } from "@/lib/mock-data";

export default function OverviewPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <DashboardHeader title="Overview" />

      <div className="flex-1 p-4 md:p-6 flex flex-col gap-5">
        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 stagger-children">
          <StatCard
            label="Total Users"
            value={mockStats.total_users}
            change={mockStats.users_change}
            icon={Users}
            accent
          />
          <StatCard
            label="Transactions"
            value={mockStats.total_transactions}
            change={mockStats.transactions_change}
            icon={CreditCard}
          />
          <StatCard
            label="Revenue"
            value={`$${mockStats.total_revenue.toLocaleString()}`}
            change={mockStats.revenue_change}
            icon={DollarSign}
            accent
          />
          <StatCard
            label="Active Users"
            value={mockStats.active_users}
            change={mockStats.active_change}
            icon={Activity}
          />
        </div>

        {/* Main Chart */}
        <OverviewChart />

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <LocationChart />
          <TransactionsHourChart />
        </div>

        {/* Payment Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <PaymentSummary />
        </div>
      </div>
    </div>
  );
}
