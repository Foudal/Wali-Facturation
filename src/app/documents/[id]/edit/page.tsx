import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { DocumentForm } from "@/components/document-form";
import { formatDateInput } from "@/lib/format";
import { updateDocumentAction } from "../../actions";

export default async function EditDocumentPage({ params }: PageProps<"/documents/[id]/edit">) {
  const { id } = await params;
  const doc = await prisma.document.findUnique({
    where: { id },
    include: { lignes: { orderBy: { ordre: "asc" } } },
  });

  if (!doc) notFound();
  if (doc.statut !== "BROUILLON") redirect(`/documents/${doc.id}`);

  const clients = await prisma.client.findMany({ orderBy: { nom: "asc" }, select: { id: true, nom: true } });
  const boundUpdate = updateDocumentAction.bind(null, doc.id);

  return (
    <div className="mx-auto max-w-3xl px-5 py-10 sm:px-8 sm:py-14">
      <h1 className="text-2xl font-bold text-[var(--ink-2)] sm:text-3xl">Modifier {doc.numero}</h1>

      <div className="mt-8">
        <DocumentForm
          action={boundUpdate}
          clients={clients}
          defaultType={doc.type as "DEVIS" | "FACTURE"}
          defaultClientId={doc.clientId}
          lockType
          submitLabel="Enregistrer les modifications"
          initial={{
            dateEmission: formatDateInput(doc.dateEmission),
            dateEcheance: doc.dateEcheance ? formatDateInput(doc.dateEcheance) : undefined,
            notes: doc.notes ?? undefined,
            lignes: doc.lignes.map((l) => ({
              description: l.description,
              quantite: String(l.quantite),
              prixUnitaire: String(l.prixUnitaire),
            })),
          }}
        />
      </div>
    </div>
  );
}
