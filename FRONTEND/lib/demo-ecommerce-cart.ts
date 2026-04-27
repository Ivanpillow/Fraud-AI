import {
  type DemoEcommerceMerchantSlug,
  isDemoEcommerceMerchantSlug,
} from "@/lib/demo-ecommerce-merchants";

export type DemoEcommerceMerchantCart = Record<string, number>;

export type DemoEcommerceCartState = Record<DemoEcommerceMerchantSlug, DemoEcommerceMerchantCart>;

export const DEMO_ECOMMERCE_CART_KEY = "demo_ecommerce_cart_v1";

const EMPTY_CART_STATE: DemoEcommerceCartState = {
  floreria: {},
  libreria: {},
  marketplace: {},
};

export function getEmptyDemoEcommerceCartState(): DemoEcommerceCartState {
  return {
    floreria: {},
    libreria: {},
    marketplace: {},
  };
}

function sanitizeMerchantCart(raw: unknown): DemoEcommerceMerchantCart {
  if (!raw || typeof raw !== "object") return {};

  const pairs = Object.entries(raw as Record<string, unknown>)
    .filter(([, qty]) => Number.isFinite(qty) && Number(qty) > 0)
    .map(([id, qty]) => [id, Math.floor(Number(qty))]);

  return Object.fromEntries(pairs);
}

export function loadDemoEcommerceCart(): DemoEcommerceCartState {
  if (typeof window === "undefined") {
    return getEmptyDemoEcommerceCartState();
  }

  try {
    const raw = window.sessionStorage.getItem(DEMO_ECOMMERCE_CART_KEY);
    if (!raw) return getEmptyDemoEcommerceCartState();

    const parsed = JSON.parse(raw) as Record<string, unknown>;

    const nextState = getEmptyDemoEcommerceCartState();
    for (const [key, value] of Object.entries(parsed)) {
      if (!isDemoEcommerceMerchantSlug(key)) continue;
      nextState[key] = sanitizeMerchantCart(value);
    }

    return nextState;
  } catch {
    return getEmptyDemoEcommerceCartState();
  }
}

export function saveDemoEcommerceCart(cart: DemoEcommerceCartState): void {
  if (typeof window === "undefined") return;

  const sanitized: DemoEcommerceCartState = {
    floreria: sanitizeMerchantCart(cart.floreria ?? EMPTY_CART_STATE.floreria),
    libreria: sanitizeMerchantCart(cart.libreria ?? EMPTY_CART_STATE.libreria),
    marketplace: sanitizeMerchantCart(cart.marketplace ?? EMPTY_CART_STATE.marketplace),
  };

  window.sessionStorage.setItem(DEMO_ECOMMERCE_CART_KEY, JSON.stringify(sanitized));
}

export function getDemoEcommerceMerchantCart(
  cart: DemoEcommerceCartState,
  merchantSlug: DemoEcommerceMerchantSlug
): DemoEcommerceMerchantCart {
  return cart[merchantSlug] ?? {};
}

export function countDemoEcommerceItems(cart: DemoEcommerceMerchantCart): number {
  return Object.values(cart).reduce((acc, qty) => acc + qty, 0);
}
