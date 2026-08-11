"use client";

import { useMemo, useState } from "react";
import { formatMontant } from "@/lib/format";

type ClientOption = { id: string; nom: string };
type LigneValue = { description: string; quantite: string; prixUnitaire: string };

const emptyLigne: LigneValue = { description: "", quantite: "1", prixUnitaire: "" };

export function DocumentForm({
  action,
  clients,
  defaultType,
  defaultClientId,
  initial,
  submitLabel,
  lockType = false,
}: {
  action: (formData: FormData) => void;
  clients: ClientOption[];
  defaultType?: "DEVIS" | "FACTURE";
  defaultClientId?: string;
  initial?: {
    dateEmission?: string;
    dateEcheance?: string;
    notes?: string;
    lignes?: LigneValue[];
  };
  submitLabel: string;
  lockType?: boolean;
}) {
  const [type, setType] = useState<"DEVIS" | "FACTURE">(defaultType ?? "FACTURE");
  const [lignes, setLignes] = useState<LigneValue[]>(
    initial?.lignes && initial.lignes.length > 0 ? initial.lignes : [{ ...emptyLigne }],
  );

  const total = useMemo(
    () =>
      lignes.reduce((sum, l) => {
        const q = parseFloat(l.quantite);
        const p = parseFloat(l.prixUnitaire);
        return sum + (Number.isFinite(q) && Number.isFinite(p) ? q * p : 0);
      }, 0),
    [lignes],
  );

  function updateLigne(index: number, patch: Partial<LigneValue>) {
    setLignes((prev) => prev.map((l, i) => (i === index ? { ...l, ...patch } : l)));
  }

  function removeLigne(index: number) {
    setLignes((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev));
  }

  return (
    <form action={action} className="flex flex-col gap-6">
      <div className="card grid gap-5 p-6 sm:grid-cols-2 sm:p-8">
        <div className="field">
          <label htmlFor="type">Type de document</label>
          <select
            id="type"
            name="type"
            value={type}
            disabled={lockType}
            onChange={(e) => setType(e.target.value as "DEVIS" | "FACTURE")}
          >
            <option value="FACTURE">Facture</option>
            <option value="DEVIS">Devis</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="clientId">Client *</label>
          <select id="clientId" name="clientId" required defaultValue={defaultClientId ?? ""}>
            <option value="" disabled>
              Choisir un client
            </option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nom}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="dateEmission">Date d&apos;émission</label>
          <input id="dateEmission" name="dateEmission" type="date" defaultValue={initial?.dateEmission} />
        </div>
        <div className="field">
          <label htmlFor="dateEcheance">Échéance</label>
          <input id="dateEcheance" name="dateEcheance" type="date" defaultValue={initial?.dateEcheance} />
        </div>
        <div className="field sm:col-span-2">
          <label htmlFor="notes">Notes (optionnel)</label>
          <textarea id="notes" name="notes" rows={2} defaultValue={initial?.notes} placeholder="Conditions de paiement, précisions..." />
        </div>
      </div>

      <div className="card p-6 sm:p-8">
        <h2 className="text-sm font-bold text-[var(--ink-2)]">Lignes</h2>

        <div className="mt-4 flex flex-col gap-3">
          {lignes.map((ligne, i) => (
            <div key={i} className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_90px_120px_110px_auto] sm:items-end">
              <div className="field">
                {i === 0 && <label>Description</label>}
                <input
                  name="ligne_description"
                  required
                  value={ligne.description}
                  onChange={(e) => updateLigne(i, { description: e.target.value })}
                  placeholder="Refonte identité visuelle"
                />
              </div>
              <div className="field">
                {i === 0 && <label>Qté</label>}
                <input
                  name="ligne_quantite"
                  type="number"
                  min="0"
                  step="0.5"
                  required
                  value={ligne.quantite}
                  onChange={(e) => updateLigne(i, { quantite: e.target.value })}
                />
              </div>
              <div className="field">
                {i === 0 && <label>Prix unitaire</label>}
                <input
                  name="ligne_prix"
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={ligne.prixUnitaire}
                  onChange={(e) => updateLigne(i, { prixUnitaire: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div className="field">
                {i === 0 && <label>Sous-total</label>}
                <p className="px-1 py-2 text-sm font-semibold text-[var(--ink)]">
                  {Number.isFinite(parseFloat(ligne.quantite)) && Number.isFinite(parseFloat(ligne.prixUnitaire))
                    ? formatMontant(parseFloat(ligne.quantite) * parseFloat(ligne.prixUnitaire))
                    : "—"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => removeLigne(i)}
                disabled={lignes.length === 1}
                className="btn btn-outline h-fit justify-self-start px-3 py-2 text-xs disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Retirer la ligne"
              >
                Retirer
              </button>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setLignes((prev) => [...prev, { ...emptyLigne }])}
          className="btn btn-outline mt-4"
        >
          + Ajouter une ligne
        </button>

        <div className="mt-6 flex justify-end border-t border-[var(--line)] pt-4">
          <p className="text-lg font-bold text-[var(--ink-2)]">Total : {formatMontant(total)}</p>
        </div>
      </div>

      <div className="flex justify-end">
        <button type="submit" className="btn btn-primary">
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
