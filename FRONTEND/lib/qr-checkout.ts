export type QrCheckoutContext = {
  merchantSlug: string;
  merchantName: string;
  merchantApiKey: string;
  subtotal: number;
  returnUrl?: string;
  transactionId?: number;
};

export type DemoQrCard = {
  label: string;
  cardNumber: string;
  displayNumber: string;
  description: string;
};

export const DEMO_QR_CARDS: DemoQrCard[] = [
  {
    label: "Visa principal",
    cardNumber: "5566100166771001",
    displayNumber: "5566 1001 6677 1001",
    description: "Tarjeta 1 con formato de Visa",
  },
  {
    label: "Mastercard secundaria",
    cardNumber: "4455100155661001",
    displayNumber: "4455 1001 5566 1001",
    description: "Tarjeta 2 con formato de Mastercard",
  },
  {
    label: "American Express demo",
    cardNumber: "343410013434343",
    displayNumber: "3434 100134 34343",
    description: "Tarjeta 3 con formato de American Express",
  },
];

export function buildQrSelectionUrl(context: QrCheckoutContext): string {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const url = new URL("/checkout/qr-select", origin || "http://localhost");
  url.searchParams.set("merchantSlug", context.merchantSlug);
  url.searchParams.set("merchantName", context.merchantName);
  url.searchParams.set("merchantApiKey", context.merchantApiKey);
  url.searchParams.set("subtotal", context.subtotal.toFixed(2));
  if (context.returnUrl) {
    url.searchParams.set("returnUrl", context.returnUrl);
  }
  if (context.transactionId) {
    url.searchParams.set("transactionId", String(context.transactionId));
  }
  return url.toString();
}

export function generateQrTransactionId(): number {
  return Math.floor(Date.now() * 1000 + Math.floor(Math.random() * 1000));
}

export function buildQrImageUrl(targetUrl: string): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(targetUrl)}`;
}
