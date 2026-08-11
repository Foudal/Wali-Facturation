import { prisma } from "@/lib/prisma";
import type { Document, LigneDocument, Paiement } from "@/generated/prisma/client";

export type DocumentWithRelations = Document & {
  lignes: LigneDocument[];
  paiements: Paiement[];
  client: { id: string; nom: string; email: string | null };
};

export function computeTotal(lignes: Pick<LigneDocument, "quantite" | "prixUnitaire">[]): number {
  return lignes.reduce((sum, l) => sum + l.quantite * l.prixUnitaire, 0);
}

export function computeEncaisse(paiements: Pick<Paiement, "montant">[]): number {
  return paiements.reduce((sum, p) => sum + p.montant, 0);
}

/**
 * Statut affiché : une facture ENVOYEE dont l'échéance est dépassée et le
 * solde non nul est affichée EN_RETARD sans que ce soit persisté en base
 * (évite un job de fond pour le MVP ; le statut réel reste ENVOYEE tant
 * qu'aucun paiement/action ne le change explicitement).
 */
export function effectiveStatut(doc: Pick<Document, "type" | "statut" | "dateEcheance">, solde: number): string {
  if (
    doc.type === "FACTURE" &&
    doc.statut === "ENVOYEE" &&
    doc.dateEcheance &&
    new Date(doc.dateEcheance) < new Date() &&
    solde > 0
  ) {
    return "EN_RETARD";
  }
  return doc.statut;
}

/**
 * Numéro suivant basé sur le suffixe numérique le plus élevé déjà utilisé
 * (pas un simple count()) : un document supprimé ne doit jamais faire
 * réapparaître un numéro déjà attribué.
 */
export async function nextNumero(type: "DEVIS" | "FACTURE"): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = type === "DEVIS" ? "DV" : "WF";
  const prefixWithYear = `${prefix}-${year}-`;

  const existing = await prisma.document.findMany({
    where: { type, numero: { startsWith: prefixWithYear } },
    select: { numero: true },
  });

  const maxSeq = existing.reduce((max, doc) => {
    const suffix = doc.numero.slice(prefixWithYear.length);
    const n = parseInt(suffix, 10);
    return Number.isFinite(n) && n > max ? n : max;
  }, 0);

  return `${prefixWithYear}${String(maxSeq + 1).padStart(4, "0")}`;
}
