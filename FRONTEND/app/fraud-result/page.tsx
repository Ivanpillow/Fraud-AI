import React, { Suspense } from "react";
import dynamic from "next/dynamic";

const FraudResultPage = dynamic(
  () => import("@/components/fraud-result-page-client"),
  { ssr: false }
);

export default function Page() {
  return (
    <Suspense fallback={<div>Cargando resultado...</div>}>
      <FraudResultPage />
    </Suspense>
  );
}