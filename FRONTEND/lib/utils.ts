import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function parseNumberish(value: number | string | null | undefined): number {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0
  }

  if (typeof value !== "string") {
    return 0
  }

  const raw = value.trim().replace(/\s+/g, "")
  if (!raw) {
    return 0
  }

  let normalized = raw

  // Maneja formatos mixtos, por ejemplo: 1,999.99 o 1.999,99.
  if (raw.includes(",") && raw.includes(".")) {
    const lastComma = raw.lastIndexOf(",")
    const lastDot = raw.lastIndexOf(".")
    if (lastComma > lastDot) {
      normalized = raw.replace(/\./g, "").replace(",", ".")
    } else {
      normalized = raw.replace(/,/g, "")
    }
  } else if (raw.includes(",")) {
    normalized = raw.replace(",", ".")
  }

  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : 0
}

export function formatCurrencyMXN(value: number | string | null | undefined): string {
  const numericValue = parseNumberish(value)
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numericValue)
}
