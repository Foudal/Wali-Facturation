import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { StatutBadge } from "@/components/statut-badge";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { computeTotal, computeEncaisse, effectiveStatut } from "@/lib/documents";
import { formatMontant, formatDate } from "@/lib/format";
import { PAIEMENT_METHODES } from "@/lib/constants";
import {
  updateStatutAction,
  convertToFactureAction,
  addPaiementAction,
  deleteDocumentAction,
} from "../actions";

export default async function DocumentDetailPage({ params }: PageProps<"/documents/[id]">) {
  const { id } = await params;
  const doc = await prisma.document.findUnique({
    where: { id },
    include: {
      client: true,
      lignes: { orderBy: { ordre: "asc" } },
      paiements: { orderBy: { date: "desc" } },
      convertedFrom: true,
      convertedTo: true,
    },
  });

  if (!doc) notFound();

  const total = computeTotal(doc.lignes);
  const encaisse = computeEncaisse(doc.paiements);
  const solde = total - encaisse;
  const statut = effectiveStatut(doc, solde);
  const isDevis = doc.type === "DEVIS";

  const setStatut = async (nextStatut: string) => {
    "use server";
    await updateStatutAction(id, nextStatut);
  };

  return (
    <div className="mx-auto max-w-3xl px-5 py-10 sm:px-8 sm:py-14">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
            {isDevis ? "Devis" : "Facture"}
          </p>
          <h1 className="text-2xl font-bold text-[var(--ink-2)] sm:text-3xl">{doc.numero}</h1>
          <Link href={`/clients/${doc.client.id}`} className="text-sm font-medium text-[var(--brand)]">
            {doc.client.nom}
          </Link>
        </div>
        <StatutBadge statut={statut} />
      </div>

      {doc.convertedFrom && (
        <p className="mt-3 text-sm text-[var(--muted)]">
          Généré depuis le devis{" "}
          <Link href={`/documents/${doc.convertedFrom.id}`} className="font-semibold text-[var(--brand)]">
            {doc.convertedFrom.numero}
          </Link>
        </p>
      )}
      {doc.convertedTo && (
        <p className="mt-3 text-sm text-[var(--muted)]">
          Converti en facture{" "}
          <Link href={`/documents/${doc.convertedTo.id}`} className="font-semibold text-[var(--brand)]">
            {doc.convertedTo.numero}
          </Link>
        </p>
      )}

      <div className="card mt-6 p-6 sm:p-8">
        <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
          <div>
            <p className="text-xs text-[var(--muted)]">Émis le</p>
            <p className="font-semibold text-[var(--ink-2)]">{formatDate(doc.dateEmission)}</p>
          </div>
          {doc.dateEcheance && (
            <div>
              <p className="text-xs text-[var(--muted)]">Échéance</p>
              <p className="font-semibold text-[var(--ink-2)]">{formatDate(doc.dateEcheance)}</p>
            </div>
          )}
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[420px] text-sm">
            <thead>
              <tr className="border-b border-[var(--line)] text-left text-xs text-[var(--muted)]">
                <th className="pb-2 font-medium">Description</th>
                <th className="pb-2 font-medium">Qté</th>
                <th className="pb-2 font-medium">Prix unit.</th>
                <th className="pb-2 text-right font-medium">Sous-total</th>
              </tr>
            </thead>
            <tbody>
              {doc.lignes.map((ligne) => (
                <tr key={ligne.id} className="border-b border-dashed border-[var(--line)]">
                  <td className="py-2.5 pr-2">{ligne.description}</td>
                  <td className="py-2.5 pr-2 text-[var(--muted)]">{ligne.quantite}</td>
                  <td className="py-2.5 pr-2 text-[var(--muted)]">{formatMontant(ligne.prixUnitaire)}</td>
                  <td className="py-2.5 text-right font-medium">
                    {formatMontant(ligne.quantite * ligne.prixUnitaire)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {doc.notes && <p className="mt-4 text-sm text-[var(--muted)]">{doc.notes}</p>}

        <div className="mt-6 flex flex-col items-end gap-1 border-t border-[var(--line)] pt-4">
          <p className="text-sm text-[var(--muted)]">Total : {formatMontant(total)}</p>
          {!isDevis && (
            <>
              <p className="text-sm text-[var(--positive-fg)]">Encaissé : {formatMontant(encaisse)}</p>
              <p className="text-lg font-bold text-[var(--ink-2)]">Solde dû : {formatMontant(solde)}</p>
            </>
          )}
        </div>
      </div>

      <div className="card mt-6 flex flex-wrap gap-3 p-5">
        {doc.statut === "BROUILLON" && (
          <>
            <Link href={`/documents/${doc.id}/edit`} className="btn btn-outline">
              Modifier
            </Link>
            <form action={setStatut.bind(null, isDevis ? "ENVOYE" : "ENVOYEE")}>
              <button type="submit" className="btn btn-primary">
                Marquer comme envoyé{isDevis ? "" : "e"}
              </button>
            </form>
            <form action={deleteDocumentAction.bind(null, doc.id)}>
              <ConfirmSubmitButton className="btn btn-danger" confirmMessage={`Supprimer le brouillon ${doc.numero} ?`}>
                Supprimer
              </ConfirmSubmitButton>
            </form>
          </>
        )}

        {isDevis && doc.statut === "ENVOYE" && (
          <>
            <form action={setStatut.bind(null, "ACCEPTE")}>
              <button type="submit" className="btn btn-primary">
                Marquer accepté
              </button>
            </form>
            <form action={setStatut.bind(null, "REFUSE")}>
              <button type="submit" className="btn btn-outline">
                Marquer refusé
              </button>
            </form>
          </>
        )}

        {isDevis && doc.statut === "ACCEPTE" && !doc.convertedTo && (
          <form action={convertToFactureAction.bind(null, doc.id)}>
            <button type="submit" className="btn btn-primary">
              Convertir en facture →
            </button>
          </form>
        )}

        {!isDevis && (doc.statut === "ENVOYEE" || statut === "EN_RETARD") && (
          <form action={setStatut.bind(null, "PAYEE")}>
            <button type="submit" className="btn btn-primary">
              Marquer payée
            </button>
          </form>
        )}

        {!isDevis && doc.statut !== "PAYEE" && doc.statut !== "ANNULEE" && doc.statut !== "BROUILLON" && (
          <form action={setStatut.bind(null, "ANNULEE")}>
            <button type="submit" className="btn btn-outline">
              Annuler
            </button>
          </form>
        )}

        <Link href={`/documents/${doc.id}/print`} className="btn btn-outline">
          Aperçu imprimable / PDF
        </Link>
      </div>

      {!isDevis && (
        <div className="card mt-6 p-6 sm:p-8">
          <h2 className="text-sm font-bold text-[var(--ink-2)]">Paiements</h2>

          {doc.paiements.length > 0 && (
            <ul className="mt-4 flex flex-col gap-2">
              {doc.paiements.map((p) => (
                <li key={p.id} className="flex items-center justify-between text-sm">
                  <span className="text-[var(--muted)]">
                    {formatDate(p.date)} {p.methode ? `· ${p.methode}` : ""}
                  </span>
                  <span className="font-semibold text-[var(--ink-2)]">{formatMontant(p.montant)}</span>
                </li>
              ))}
            </ul>
          )}

          {solde > 0 && (
            <form action={addPaiementAction.bind(null, doc.id)} className="mt-5 flex flex-wrap items-end gap-3 border-t border-[var(--line)] pt-5">
              <div className="field">
                <label htmlFor="montant">Montant</label>
                <input id="montant" name="montant" type="number" min="0" step="0.01" required defaultValue={solde} className="w-32" />
              </div>
              <div className="field">
                <label htmlFor="date">Date</label>
                <input id="date" name="date" type="date" />
              </div>
              <div className="field">
                <label htmlFor="methode">Méthode</label>
                <select id="methode" name="methode" defaultValue="virement">
                  {PAIEMENT_METHODES.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
              <button type="submit" className="btn btn-primary">
                Enregistrer le paiement
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
