export type DemoLibreriaCartState = Record<string, number>;

export const DEMO_LIBRERIA_CART_KEY = "demo_libreria_cart_v1";

export function loadDemoLibreriaCart(): DemoLibreriaCartState {
  if (typeof window === "undefined") return {};

  try {
    const raw = window.sessionStorage.getItem(DEMO_LIBRERIA_CART_KEY);
    if (!raw) return {};

    const parsed = JSON.parse(raw) as DemoLibreriaCartState;
    if (!parsed || typeof parsed !== "object") return {};

    return Object.fromEntries(
      Object.entries(parsed)
        .filter(([, qty]) => Number.isFinite(qty) && qty > 0)
        .map(([id, qty]) => [id, Math.floor(qty)])
    );
  } catch {
    return {};
  }
}

export function saveDemoLibreriaCart(cart: DemoLibreriaCartState): void {
  if (typeof window === "undefined") return;

  const sanitized = Object.fromEntries(
    Object.entries(cart)
      .filter(([, qty]) => Number.isFinite(qty) && qty > 0)
      .map(([id, qty]) => [id, Math.floor(qty)])
  );

  window.sessionStorage.setItem(DEMO_LIBRERIA_CART_KEY, JSON.stringify(sanitized));
}

export function clearDemoLibreriaCart(): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(DEMO_LIBRERIA_CART_KEY);
}

export function countDemoLibreriaItems(cart: DemoLibreriaCartState): number {
  return Object.values(cart).reduce((acc, qty) => acc + qty, 0);
}
