import React, { Suspense } from "react";
import FraudResultPage from "./fraud-result-page-client";

export default function Page() {
  return (
    <Suspense fallback={<div>Cargando resultado...</div>}>
      <FraudResultPage />
    </Suspense>
  );
}