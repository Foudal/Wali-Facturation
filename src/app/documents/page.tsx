import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { StatutBadge } from "@/components/statut-badge";
import { computeTotal, computeEncaisse, effectiveStatut } from "@/lib/documents";
import { formatMontant, formatDate } from "@/lib/format";

export default async function DocumentsPage({ searchParams }: PageProps<"/documents">) {
  const params = await searchParams;
  const type = params.type === "DEVIS" || params.type === "FACTURE" ? params.type : undefined;

  const documents = await prisma.document.findMany({
    where: type ? { type } : undefined,
    include: { client: true, lignes: true, paiements: true },
    orderBy: { dateEmission: "desc" },
  });

  const tabs: { label: string; value?: "DEVIS" | "FACTURE" }[] = [
    { label: "Tous", value: undefined },
    { label: "Factures", value: "FACTURE" },
    { label: "Devis", value: "DEVIS" },
  ];

  return (
    <div className="mx-auto max-w-5xl px-5 py-10 sm:px-8 sm:py-14">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--ink-2)] sm:text-3xl">Devis & factures</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">{documents.length} document(s)</p>
        </div>
        <Link href="/documents/new" className="btn btn-primary">
          + Nouveau document
        </Link>
      </div>

      <div className="mt-6 flex gap-2">
        {tabs.map((tab) => {
          const active = tab.value === type;
          const href = tab.value ? `/documents?type=${tab.value}` : "/documents";
          return (
            <Link
              key={tab.label}
              href={href}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
                active ? "bg-[var(--ink-2)] text-white" : "bg-gray-100 text-[var(--muted)] hover:bg-gray-200"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      {documents.length === 0 ? (
        <p className="card mt-6 px-6 py-16 text-center text-sm text-[var(--muted)]">
          Aucun document pour l&apos;instant.
        </p>
      ) : (
        <div className="card mt-6 divide-y divide-[var(--line)] overflow-hidden">
          {documents.map((doc) => {
            const total = computeTotal(doc.lignes);
            const encaisse = computeEncaisse(doc.paiements);
            const statut = effectiveStatut(doc, total - encaisse);
            return (
              <Link
                key={doc.id}
                href={`/documents/${doc.id}`}
                className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 hover:bg-gray-50 sm:px-6"
              >
                <div>
                  <p className="font-semibold text-[var(--ink-2)]">
                    {doc.numero} <span className="font-normal text-[var(--muted)]">· {doc.client.nom}</span>
                  </p>
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
    </div>
  );
}
