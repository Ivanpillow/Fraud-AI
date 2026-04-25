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

/** Lee el cuerpo de una respuesta HTTP fallida (JSON FastAPI o texto plano del servidor). */
export async function readHttpErrorMessage(response: Response): Promise<string> {
  const statusPart = `Error HTTP ${response.status}`;
  const text = await response.text();
  if (!text.trim()) {
    return statusPart;
  }
  try {
    const data = JSON.parse(text) as { detail?: unknown };
    if (typeof data.detail === "string") {
      return data.detail;
    }
    if (Array.isArray(data.detail)) {
      const parts = data.detail.map((item: { msg?: string; type?: string }) => {
        if (item && typeof item === "object") {
          return typeof item.msg === "string" ? item.msg : JSON.stringify(item);
        }
        return String(item);
      });
      const joined = parts.filter(Boolean).join(" · ");
      return joined || statusPart;
    }
    if (data.detail != null) {
      return JSON.stringify(data.detail);
    }
  } catch {
    // cuerpo no JSON (p. ej. "Internal Server Error" de Starlette)
  }
  const trimmed = text.trim().slice(0, 500);
  return trimmed || statusPart;
}
