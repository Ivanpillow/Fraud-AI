import { Suspense } from "react";
import BcPayPageClient from "./BcPayPageClient";

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <BcPayPageClient />
    </Suspense>
  );
}
