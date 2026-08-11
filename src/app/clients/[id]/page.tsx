import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ClientForm } from "@/components/client-form";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { StatutBadge } from "@/components/statut-badge";
import { computeTotal, computeEncaisse, effectiveStatut } from "@/lib/documents";
import { formatMontant, formatDate } from "@/lib/format";
import { updateClientAction, deleteClientAction } from "../actions";

export default async function ClientDetailPage({ params }: PageProps<"/clients/[id]">) {
  const { id } = await params;
  const client = await prisma.client.findUnique({
    where: { id },
    include: {
      documents: {
        include: { lignes: true, paiements: true },
        orderBy: { dateEmission: "desc" },
      },
    },
  });

  if (!client) notFound();

  const boundUpdate = updateClientAction.bind(null, client.id);
  const boundDelete = deleteClientAction.bind(null, client.id);

  return (
    <div className="mx-auto max-w-3xl px-5 py-10 sm:px-8 sm:py-14">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-[var(--ink-2)] sm:text-3xl">{client.nom}</h1>
        <Link href="/clients" className="text-sm font-medium text-[var(--muted)] hover:text-[var(--ink-2)]">
          ← Tous les clients
        </Link>
      </div>

      <div className="mt-8">
        <ClientForm action={boundUpdate} client={client} submitLabel="Enregistrer les modifications" />
      </div>

      <div className="mt-10 flex items-center justify-between">
        <h2 className="text-lg font-bold text-[var(--ink-2)]">Devis & factures</h2>
        <Link href={`/documents/new?clientId=${client.id}`} className="text-sm font-semibold text-[var(--brand)]">
          + Nouveau document
        </Link>
      </div>

      {client.documents.length === 0 ? (
        <p className="card mt-4 px-5 py-8 text-center text-sm text-[var(--muted)]">
          Aucun devis ou facture pour ce client.
        </p>
      ) : (
        <div className="card mt-4 divide-y divide-[var(--line)] overflow-hidden">
          {client.documents.map((doc) => {
            const total = computeTotal(doc.lignes);
            const encaisse = computeEncaisse(doc.paiements);
            const statut = effectiveStatut(doc, total - encaisse);
            return (
              <Link
                key={doc.id}
                href={`/documents/${doc.id}`}
                className="flex flex-wrap items-center justify-between gap-2 px-5 py-4 hover:bg-gray-50"
              >
                <div>
                  <p className="font-semibold text-[var(--ink-2)]">{doc.numero}</p>
                  <p className="text-xs text-[var(--muted)]">{formatDate(doc.dateEmission)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-[var(--ink)]">{formatMontant(total)}</span>
                  <StatutBadge statut={statut} />
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <div className="mt-10 border-t border-[var(--line)] pt-6">
        {client.documents.length === 0 ? (
          <form action={boundDelete}>
            <ConfirmSubmitButton
              className="btn btn-danger"
              confirmMessage={`Supprimer définitivement ${client.nom} ?`}
            >
              Supprimer ce client
            </ConfirmSubmitButton>
          </form>
        ) : (
          <p className="text-xs text-[var(--muted)]">
            Ce client a des devis/factures rattachés, il ne peut pas être supprimé.
          </p>
        )}
      </div>
    </div>
  );
}
