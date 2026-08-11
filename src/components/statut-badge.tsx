import { STATUT_LABELS, STATUT_TONES } from "@/lib/constants";

const toneClasses: Record<string, string> = {
  positive: "bg-[var(--positive-bg)] text-[var(--positive-fg)]",
  warning: "bg-[var(--warning-bg)] text-[var(--warning-fg)]",
  negative: "bg-[var(--negative-bg)] text-[var(--negative-fg)]",
  neutral: "bg-gray-100 text-gray-600",
};

const dotClasses: Record<string, string> = {
  positive: "bg-[var(--positive-dot)]",
  warning: "bg-amber-500",
  negative: "bg-red-500",
  neutral: "bg-gray-400",
};

export function StatutBadge({ statut }: { statut: string }) {
  const tone = STATUT_TONES[statut] ?? "neutral";
  const label = STATUT_LABELS[statut] ?? statut;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold whitespace-nowrap ${toneClasses[tone]}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dotClasses[tone]}`} />
      {label}
    </span>
  );
}
