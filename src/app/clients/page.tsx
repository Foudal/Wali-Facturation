import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  const clients = await prisma.client.findMany({
    orderBy: { nom: "asc" },
    include: { _count: { select: { documents: true } } },
  });

  return (
    <div className="mx-auto max-w-5xl px-5 py-10 sm:px-8 sm:py-14">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--ink-2)] sm:text-3xl">Clients</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">{clients.length} client(s)</p>
        </div>
        <Link href="/clients/new" className="btn btn-primary">
          + Nouveau client
        </Link>
      </div>

      {clients.length === 0 ? (
        <div className="card mt-8 flex flex-col items-center gap-3 px-6 py-16 text-center">
          <p className="text-[var(--ink-2)] font-semibold">Aucun client pour l&apos;instant</p>
          <p className="max-w-sm text-sm text-[var(--muted)]">
            Ajoutez votre premier client pour pouvoir lui envoyer un devis ou une facture.
          </p>
          <Link href="/clients/new" className="btn btn-primary mt-2">
            + Nouveau client
          </Link>
        </div>
      ) : (
        <div className="card mt-8 divide-y divide-[var(--line)] overflow-hidden">
          {clients.map((client) => (
            <Link
              key={client.id}
              href={`/clients/${client.id}`}
              className="flex flex-wrap items-center justify-between gap-2 px-5 py-4 transition-colors hover:bg-gray-50 sm:px-6"
            >
              <div>
                <p className="font-semibold text-[var(--ink-2)]">{client.nom}</p>
                <p className="text-sm text-[var(--muted)]">{client.email || "Pas d'email renseigné"}</p>
              </div>
              <span className="text-xs font-medium text-[var(--muted)]">
                {client._count.documents} document{client._count.documents > 1 ? "s" : ""}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
