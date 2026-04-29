export type QrCheckoutContext = {
  merchantSlug: string;
  merchantName: string;
  merchantApiKey: string;
  subtotal: number;
  returnUrl?: string;
  transactionId?: number;
  shippingCountry?: string;
  shippingState?: string;
  shippingCity?: string;
  shippingPostalCode?: string;
  shippingStreet?: string;
  shippingReference?: string;
  shippingFullName?: string;
  shippingPhone?: string;
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
  if (context.shippingCountry) url.searchParams.set("shippingCountry", context.shippingCountry);
  if (context.shippingState) url.searchParams.set("shippingState", context.shippingState);
  if (context.shippingCity) url.searchParams.set("shippingCity", context.shippingCity);
  if (context.shippingPostalCode) url.searchParams.set("shippingPostalCode", context.shippingPostalCode);
  if (context.shippingStreet) url.searchParams.set("shippingStreet", context.shippingStreet);
  if (context.shippingReference) url.searchParams.set("shippingReference", context.shippingReference);
  if (context.shippingFullName) url.searchParams.set("shippingFullName", context.shippingFullName);
  if (context.shippingPhone) url.searchParams.set("shippingPhone", context.shippingPhone);
  return url.toString();
}

export function generateQrTransactionId(): number {
  return Math.floor(Date.now() * 1000 + Math.floor(Math.random() * 1000));
}

export function buildQrImageUrl(targetUrl: string): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(targetUrl)}`;
}

export function buildBcPaymentUrl(paymentId: number): string {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const url = new URL("/checkout/bc-pay", origin || "http://localhost");
  url.searchParams.set("paymentId", String(paymentId));
  return url.toString();
}
