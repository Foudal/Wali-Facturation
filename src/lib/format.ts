import { DEVISE_DECIMALS } from "@/lib/constants";

export function formatMontant(value: number, devise: string = "EUR"): string {
  const decimals = DEVISE_DECIMALS[devise as keyof typeof DEVISE_DECIMALS] ?? 2;

  // GNF doesn't have a standard Unicode currency code in Intl, so we handle it specially
  if (devise === "GNF") {
    return new Intl.NumberFormat("fr-FR", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value) + " FG";
  }

  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: devise,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function formatDate(value: Date | string): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" }).format(date);
}

export function formatDateInput(value: Date | string): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return date.toISOString().slice(0, 10);
}
