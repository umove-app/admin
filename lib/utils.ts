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
