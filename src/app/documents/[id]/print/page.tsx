import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PrintButton } from "@/components/print-button";
import { computeSubtotal, computeTVA, computeEncaisse } from "@/lib/documents";
import { formatMontant, formatDate } from "@/lib/format";

export default async function PrintDocumentPage({ params }: PageProps<"/documents/[id]/print">) {
  const { id } = await params;
  const doc = await prisma.document.findUnique({
    where: { id },
    include: { client: true, lignes: { orderBy: { ordre: "asc" } }, paiements: true },
  });

  if (!doc) notFound();

  const subtotal = computeSubtotal(doc.lignes);
  const montantTVA = computeTVA(subtotal, doc.tva);
  const total = subtotal + montantTVA;
  const encaisse = computeEncaisse(doc.paiements);
  const isDevis = doc.type === "DEVIS";

  return (
    <div className="mx-auto max-w-3xl px-5 py-10 sm:px-8 sm:py-14">
      <div className="no-print mb-6 flex justify-end">
        <PrintButton />
      </div>

      <div className="card p-8 sm:p-12" id="print-area">
        <div className="flex flex-wrap items-start justify-between gap-6 border-b border-[var(--line)] pb-8">
          <div>
            <p className="text-lg font-bold text-[var(--ink-2)]">
              Wali<span className="text-[var(--brand)]">Facturation</span>
            </p>
            {/* Placeholder honnête : à remplacer par les vraies mentions légales de l'émetteur (SIRET, TVA, adresse). */}
            <p className="mt-1 text-xs text-[var(--muted)]">Coordonnées de l&apos;émetteur à compléter</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
              {isDevis ? "Devis" : "Facture"} · {doc.devise}
            </p>
            <p className="text-xl font-bold text-[var(--ink-2)]">{doc.numero}</p>
            <p className="mt-1 text-xs text-[var(--muted)]">Émis le {formatDate(doc.dateEmission)}</p>
            {doc.dateEcheance && (
              <p className="text-xs text-[var(--muted)]">Échéance le {formatDate(doc.dateEcheance)}</p>
            )}
          </div>
        </div>

        <div className="mt-8">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Facturé à</p>
          <p className="mt-1 font-semibold text-[var(--ink-2)]">{doc.client.nom}</p>
          {doc.client.adresse && <p className="text-sm text-[var(--muted)] whitespace-pre-line">{doc.client.adresse}</p>}
          {doc.client.email && <p className="text-sm text-[var(--muted)]">{doc.client.email}</p>}
        </div>

        <table className="mt-8 w-full text-sm">
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
                <td className="py-2.5 pr-2 text-[var(--muted)]">{formatMontant(ligne.prixUnitaire, doc.devise)}</td>
                <td className="py-2.5 text-right font-medium">{formatMontant(ligne.quantite * ligne.prixUnitaire, doc.devise)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-6 flex flex-col items-end gap-1 border-t border-[var(--line)] pt-4">
          <p className="text-sm text-[var(--muted)]">Sous-total : {formatMontant(subtotal, doc.devise)}</p>
          {montantTVA > 0 && (
            <p className="text-sm text-[var(--muted)]">
              TVA ({doc.tva}%) : {formatMontant(montantTVA, doc.devise)}
            </p>
          )}
          <p className="text-lg font-bold text-[var(--ink-2)]">Total {isDevis ? "" : "TTC"} : {formatMontant(total, doc.devise)}</p>
          {!isDevis && encaisse > 0 && (
            <>
              <p className="text-sm text-[var(--positive-fg)]">Déjà réglé : {formatMontant(encaisse, doc.devise)}</p>
              <p className="text-sm font-semibold text-[var(--ink-2)]">Reste dû : {formatMontant(total - encaisse, doc.devise)}</p>
            </>
          )}
        </div>

        {doc.notes && (
          <div className="mt-8 border-t border-[var(--line)] pt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Notes</p>
            <p className="mt-1 text-sm text-[var(--muted)]">{doc.notes}</p>
          </div>
        )}

        {/* Placeholder honnête : mentions légales (pénalités de retard, TVA non applicable art. 293B, etc.) à ajouter selon le statut de l'émetteur. */}
        <p className="mt-10 text-[10px] text-[var(--muted)]">
          Mentions légales à compléter selon votre statut (pénalités de retard, TVA, etc.).
        </p>
      </div>
    </div>
  );
}
