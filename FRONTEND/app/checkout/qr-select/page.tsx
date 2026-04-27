import { Suspense } from "react";
import QrSelectPageClient from "./QrSelectPageClient";

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <QrSelectPageClient />
    </Suspense>
  );
}