import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Safely format a coordinate that the API may serialize as a string
 * (Postgres decimal columns come back as strings), null, or a number.
 * Returns "N/A" for missing/invalid values instead of throwing.
 */
export function formatCoord(
  value: number | string | null | undefined,
  digits = 6,
): string {
  const n = typeof value === "number" ? value : parseFloat(String(value));
  return Number.isFinite(n) ? n.toFixed(digits) : "N/A";
}

/**
 * Safely format a numeric value (e.g. distance) that may be a string, null, or
 * undefined. Returns "N/A" for missing/invalid values instead of throwing.
 */
export function formatNumber(
  value: number | string | null | undefined,
  digits = 1,
): string {
  const n = typeof value === "number" ? value : parseFloat(String(value));
  return Number.isFinite(n) ? n.toFixed(digits) : "N/A";
}

/**
 * Safely format a currency amount. Postgres decimal columns (price/total) are
 * serialized as strings by the API, and some fields may be null/undefined.
 * Coerces to a finite number before formatting; returns "N/A" otherwise so the
 * UI never shows "NaN".
 */
export function formatCurrency(
  value: number | string | null | undefined,
  currency = "NGN",
): string {
  const n = typeof value === "number" ? value : parseFloat(String(value));
  if (!Number.isFinite(n)) return "N/A";
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
  }).format(n);
}
