import type { DemoEcommerceMerchant } from "@/lib/demo-ecommerce-merchants";
import {
  saveFraudAICheckoutContext,
  type FraudAICheckoutContextV1,
} from "@/lib/fraudai-checkout-context";

export interface DemoEcommerceCartLine {
  id: string;
  name: string;
  price: number;
  qty: number;
  imageUrl?: string;
}

export function calcDemoEcommerceSubtotal(items: DemoEcommerceCartLine[]): number {
  return Number(items.reduce((acc, item) => acc + item.price * item.qty, 0).toFixed(2));
}

export function buildDemoEcommerceCheckoutContext(
  merchant: DemoEcommerceMerchant,
  cartItems: DemoEcommerceCartLine[],
  returnUrl?: string
): FraudAICheckoutContextV1 {
  const subtotal = calcDemoEcommerceSubtotal(cartItems);

  return {
    version: 1,
    merchant: {
      slug: merchant.slug,
      name: merchant.name,
      apiKey: merchant.apiKey,
    },
    cart: {
      currency: "MXN",
      items: cartItems.map((item) => ({
        id: item.id,
        name: item.name,
        price: item.price,
        qty: item.qty,
        imageUrl: item.imageUrl,
      })),
      subtotal,
      shipping: 0,
      tax: 0,
      total: subtotal,
    },
    returnUrl: returnUrl ?? (typeof window !== "undefined" ? window.location.href : "/demo-ecommerce"),
    createdAt: new Date().toISOString(),
  };
}

export function proceedToDemoEcommerceCheckout(
  merchant: DemoEcommerceMerchant,
  cartItems: DemoEcommerceCartLine[],
  returnUrl?: string,
  checkoutPath = "/demo-ecommerce/checkout"
): void {
  if (cartItems.length === 0) {
    throw new Error("El carrito esta vacio");
  }

  const checkoutContext = buildDemoEcommerceCheckoutContext(merchant, cartItems, returnUrl);
  saveFraudAICheckoutContext(checkoutContext);

  if (typeof window !== "undefined") {
    window.location.href = checkoutPath;
  }
}
