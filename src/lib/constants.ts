export const DOCUMENT_TYPE = {
  DEVIS: "DEVIS",
  FACTURE: "FACTURE",
} as const;

export type DocumentType = (typeof DOCUMENT_TYPE)[keyof typeof DOCUMENT_TYPE];

export const DEVIS_STATUTS = ["BROUILLON", "ENVOYE", "ACCEPTE", "REFUSE"] as const;
export const FACTURE_STATUTS = ["BROUILLON", "ENVOYEE", "PAYEE", "EN_RETARD", "ANNULEE"] as const;

export type DevisStatut = (typeof DEVIS_STATUTS)[number];
export type FactureStatut = (typeof FACTURE_STATUTS)[number];
export type Statut = DevisStatut | FactureStatut;

export const STATUT_LABELS: Record<string, string> = {
  BROUILLON: "Brouillon",
  ENVOYE: "Envoyé",
  ENVOYEE: "Envoyée",
  ACCEPTE: "Accepté",
  REFUSE: "Refusé",
  PAYEE: "Payée",
  EN_RETARD: "En retard",
  ANNULEE: "Annulée",
};

export const STATUT_TONES: Record<string, "neutral" | "positive" | "warning" | "negative"> = {
  BROUILLON: "neutral",
  ENVOYE: "warning",
  ENVOYEE: "warning",
  ACCEPTE: "positive",
  PAYEE: "positive",
  REFUSE: "negative",
  EN_RETARD: "negative",
  ANNULEE: "negative",
};

export const PAIEMENT_METHODES = ["virement", "carte", "cheque", "especes", "autre"] as const;
