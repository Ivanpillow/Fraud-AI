export type FraudAICartItem = {
  id: string
  name: string
  price: number
  qty: number
  imageUrl?: string
}

export type FraudAICheckoutContextV1 = {
  version: 1
  merchant: {
    slug: "floreria" | "libreria" | "marketplace" | (string & {})
    name: string
    /** API key que el backend de FraudAI valida vía header X-API-Key */
    apiKey: string
  }
  cart: {
    currency: "MXN" | (string & {})
    items: FraudAICartItem[]
    subtotal: number
    shipping: number
    tax: number
    total: number
  }
  /** URL para volver a la tienda (opcional) */
  returnUrl?: string
  createdAt: string
}

export const FRAUDAI_CHECKOUT_CONTEXT_KEY = "fraudai_checkout_context_v1"

export function loadFraudAICheckoutContext(): FraudAICheckoutContextV1 | null {
  if (typeof window === "undefined") return null
  try {
    const raw = window.sessionStorage.getItem(FRAUDAI_CHECKOUT_CONTEXT_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as FraudAICheckoutContextV1
    if (!parsed || parsed.version !== 1) return null
    if (!parsed.merchant?.apiKey) return null
    return parsed
  } catch {
    return null
  }
}

export function saveFraudAICheckoutContext(ctx: FraudAICheckoutContextV1): void {
  if (typeof window === "undefined") return
  window.sessionStorage.setItem(FRAUDAI_CHECKOUT_CONTEXT_KEY, JSON.stringify(ctx))
}

export function clearFraudAICheckoutContext(): void {
  if (typeof window === "undefined") return
  window.sessionStorage.removeItem(FRAUDAI_CHECKOUT_CONTEXT_KEY)
}

