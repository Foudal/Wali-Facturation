import { prisma } from "@/lib/prisma";
import { DocumentForm } from "@/components/document-form";
import { createDocumentAction } from "../actions";

export default async function NewDocumentPage({ searchParams }: PageProps<"/documents/new">) {
  const params = await searchParams;
  const clientId = typeof params.clientId === "string" ? params.clientId : undefined;
  const type = params.type === "DEVIS" ? "DEVIS" : "FACTURE";

  const clients = await prisma.client.findMany({ orderBy: { nom: "asc" }, select: { id: true, nom: true } });

  return (
    <div className="mx-auto max-w-3xl px-5 py-10 sm:px-8 sm:py-14">
      <h1 className="text-2xl font-bold text-[var(--ink-2)] sm:text-3xl">Nouveau document</h1>

      {clients.length === 0 ? (
        <p className="card mt-8 px-6 py-10 text-center text-sm text-[var(--muted)]">
          Créez d&apos;abord un client avant de pouvoir émettre un devis ou une facture.
        </p>
      ) : (
        <div className="mt-8">
          <DocumentForm
            action={createDocumentAction}
            clients={clients}
            defaultType={type}
            defaultClientId={clientId}
            submitLabel="Créer le brouillon"
          />
        </div>
      )}
    </div>
  );
}
