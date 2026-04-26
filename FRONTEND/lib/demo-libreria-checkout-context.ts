import type { FraudAICartItem } from "@/lib/fraudai-checkout-context";

export type DemoLibreriaCheckoutContext = {
  version: 1;
  merchant: {
    slug: "libreria" | (string & {});
    name: string;
    apiKey: string;
  };
  cart: {
    currency: "MXN" | (string & {});
    items: FraudAICartItem[];
    subtotal: number;
    shipping: number;
    tax: number;
    total: number;
  };
  returnUrl?: string;
  createdAt: string;
};

export const DEMO_LIBRERIA_CHECKOUT_CONTEXT_KEY = "demo_libreria_checkout_context_v1";

export function loadDemoLibreriaCheckoutContext(): DemoLibreriaCheckoutContext | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.sessionStorage.getItem(DEMO_LIBRERIA_CHECKOUT_CONTEXT_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as DemoLibreriaCheckoutContext;
    if (!parsed || parsed.version !== 1) return null;
    if (!parsed.merchant?.apiKey) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveDemoLibreriaCheckoutContext(ctx: DemoLibreriaCheckoutContext): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(DEMO_LIBRERIA_CHECKOUT_CONTEXT_KEY, JSON.stringify(ctx));
}

export function clearDemoLibreriaCheckoutContext(): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(DEMO_LIBRERIA_CHECKOUT_CONTEXT_KEY);
}
