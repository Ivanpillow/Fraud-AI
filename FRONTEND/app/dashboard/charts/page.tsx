"use client";

import DashboardHeader from "@/components/dashboard/header";
import RevenueComparison from "@/components/dashboard/charts/revenue-comparison";
import ConversionFunnel from "@/components/dashboard/charts/conversion-funnel";
import RevenueByLocation from "@/components/dashboard/charts/revenue-by-location";

export default function ChartsPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <DashboardHeader title="Charts" breadcrumb="Analytics" />

      <div className="flex-1 p-4 md:p-6 flex flex-col gap-5">
        {/* Revenue Comparison */}
        <RevenueComparison />

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <ConversionFunnel />
          <RevenueByLocation />
        </div>
      </div>
    </div>
  );
}
