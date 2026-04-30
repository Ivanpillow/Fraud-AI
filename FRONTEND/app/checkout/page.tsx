"use client";

import React, { Suspense } from "react";
import dynamic from "next/dynamic";

const CheckoutPage = dynamic(() => import("@/components/checkout/checkout-page-pruebas"), {
  ssr: false,
});

const AdminFloatingButton = dynamic(
  () => import("@/components/checkout/admin-floating-button"),
  { ssr: false }
);

export default function Checkout() {
  return (
    <main className="relative min-h-screen checkout-bg overflow-hidden">
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full bg-blue-500/8 blur-[140px]" />
        <div className="absolute top-[40%] right-[20%] w-[300px] h-[300px] rounded-full bg-purple-500/6 blur-[100px]" />
      </div>

      <div className="relative z-10">
        <Suspense fallback={<div>Cargando checkout...</div>}>
          <CheckoutPage />
        </Suspense>
      </div>

      <AdminFloatingButton />
    </main>
  );
}