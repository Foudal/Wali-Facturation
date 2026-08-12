"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { nextNumero, computeSubtotal, computeTVA } from "@/lib/documents";
import { DEVIS_STATUTS, FACTURE_STATUTS } from "@/lib/constants";

type LigneInput = { description: string; quantite: number; prixUnitaire: number };

function parseLignes(formData: FormData): LigneInput[] {
  const descriptions = formData.getAll("ligne_description") as string[];
  const quantites = formData.getAll("ligne_quantite") as string[];
  const prix = formData.getAll("ligne_prix") as string[];

  const lignes: LigneInput[] = [];
  for (let i = 0; i < descriptions.length; i++) {
    const description = descriptions[i]?.trim();
    const quantite = parseFloat(quantites[i]);
    const prixUnitaire = parseFloat(prix[i]);
    if (!description || Number.isNaN(quantite) || Number.isNaN(prixUnitaire)) continue;
    lignes.push({ description, quantite, prixUnitaire });
  }
  return lignes;
}

export async function createDocumentAction(formData: FormData) {
  const type = formData.get("type") === "DEVIS" ? "DEVIS" : "FACTURE";
  const clientId = formData.get("clientId") as string;
  const dateEmission = formData.get("dateEmission") as string;
  const dateEcheance = formData.get("dateEcheance") as string;
  const notes = (formData.get("notes") as string | null)?.trim() || null;
  const devise = (formData.get("devise") as string) || "EUR";
  const tva = parseFloat((formData.get("tva") as string) || "18.0");

  if (!clientId) throw new Error("Sélectionnez un client.");

  const lignes = parseLignes(formData);
  if (lignes.length === 0) throw new Error("Ajoutez au moins une ligne avec description, quantité et prix.");

  const numero = await nextNumero(type);
  const subtotal = computeSubtotal(lignes);
  const montantTVA = computeTVA(subtotal, tva);

  const doc = await prisma.document.create({
    data: {
      type,
      numero,
      statut: "BROUILLON",
      clientId,
      dateEmission: dateEmission ? new Date(dateEmission) : new Date(),
      dateEcheance: dateEcheance ? new Date(dateEcheance) : null,
      notes,
      devise,
      tva,
      montantTVA,
      lignes: {
        create: lignes.map((l, ordre) => ({ ...l, ordre })),
      },
    },
  });

  revalidatePath("/documents");
  revalidatePath("/");
  redirect(`/documents/${doc.id}`);
}

export async function updateDocumentAction(id: string, formData: FormData) {
  const existing = await prisma.document.findUniqueOrThrow({ where: { id } });
  if (existing.statut !== "BROUILLON") {
    throw new Error("Seuls les documents en brouillon peuvent être modifiés.");
  }

  const clientId = formData.get("clientId") as string;
  const dateEmission = formData.get("dateEmission") as string;
  const dateEcheance = formData.get("dateEcheance") as string;
  const notes = (formData.get("notes") as string | null)?.trim() || null;
  const devise = (formData.get("devise") as string) || "EUR";
  const tva = parseFloat((formData.get("tva") as string) || "18.0");

  const lignes = parseLignes(formData);
  if (lignes.length === 0) throw new Error("Ajoutez au moins une ligne avec description, quantité et prix.");

  const subtotal = computeSubtotal(lignes);
  const montantTVA = computeTVA(subtotal, tva);

  await prisma.$transaction([
    prisma.ligneDocument.deleteMany({ where: { documentId: id } }),
    prisma.document.update({
      where: { id },
      data: {
        clientId,
        dateEmission: dateEmission ? new Date(dateEmission) : new Date(),
        dateEcheance: dateEcheance ? new Date(dateEcheance) : null,
        notes,
        devise,
        tva,
        montantTVA,
        lignes: { create: lignes.map((l, ordre) => ({ ...l, ordre })) },
      },
    }),
  ]);

  revalidatePath("/documents");
  revalidatePath(`/documents/${id}`);
  redirect(`/documents/${id}`);
}

export async function updateStatutAction(id: string, statut: string) {
  const doc = await prisma.document.findUniqueOrThrow({ where: { id } });
  const allowed = doc.type === "DEVIS" ? DEVIS_STATUTS : FACTURE_STATUTS;
  if (!allowed.includes(statut as never)) {
    throw new Error("Statut invalide pour ce type de document.");
  }
  await prisma.document.update({ where: { id }, data: { statut } });
  revalidatePath("/documents");
  revalidatePath(`/documents/${id}`);
  revalidatePath("/");
}

export async function convertToFactureAction(devisId: string) {
  const devis = await prisma.document.findUniqueOrThrow({
    where: { id: devisId },
    include: { lignes: true },
  });
  if (devis.type !== "DEVIS") throw new Error("Seul un devis peut être converti en facture.");

  const existingConversion = await prisma.document.findUnique({ where: { convertedFromId: devisId } });
  if (existingConversion) redirect(`/documents/${existingConversion.id}`);

  const numero = await nextNumero("FACTURE");
  const subtotal = computeSubtotal(devis.lignes);
  const montantTVA = computeTVA(subtotal, devis.tva);

  const facture = await prisma.document.create({
    data: {
      type: "FACTURE",
      numero,
      statut: "BROUILLON",
      clientId: devis.clientId,
      dateEmission: new Date(),
      dateEcheance: devis.dateEcheance,
      notes: devis.notes,
      devise: devis.devise,
      tauxChange: devis.tauxChange,
      tva: devis.tva,
      montantTVA,
      convertedFromId: devis.id,
      lignes: {
        create: devis.lignes.map((l) => ({
          description: l.description,
          quantite: l.quantite,
          prixUnitaire: l.prixUnitaire,
          ordre: l.ordre,
        })),
      },
    },
  });

  await prisma.document.update({ where: { id: devis.id }, data: { statut: "ACCEPTE" } });

  revalidatePath("/documents");
  revalidatePath("/");
  redirect(`/documents/${facture.id}`);
}

export async function addPaiementAction(documentId: string, formData: FormData) {
  const montant = parseFloat(formData.get("montant") as string);
  if (Number.isNaN(montant) || montant <= 0) throw new Error("Montant invalide.");
  const methode = (formData.get("methode") as string | null) || null;
  const date = formData.get("date") as string;

  await prisma.$transaction(async (tx) => {
    await tx.paiement.create({
      data: { documentId, montant, methode, date: date ? new Date(date) : new Date() },
    });

    const doc = await tx.document.findUniqueOrThrow({
      where: { id: documentId },
      include: { lignes: true, paiements: true },
    });
    const subtotal = doc.lignes.reduce((s, l) => s + l.quantite * l.prixUnitaire, 0);
    const total = subtotal + doc.montantTVA;
    const encaisse = doc.paiements.reduce((s, p) => s + p.montant, 0) + montant;
    if (encaisse >= total && doc.statut !== "PAYEE") {
      await tx.document.update({ where: { id: documentId }, data: { statut: "PAYEE" } });
    }
  });

  revalidatePath(`/documents/${documentId}`);
  revalidatePath("/");
}

export async function deleteDocumentAction(id: string) {
  const doc = await prisma.document.findUniqueOrThrow({ where: { id } });
  if (doc.statut !== "BROUILLON") {
    throw new Error("Seuls les documents en brouillon peuvent être supprimés.");
  }
  await prisma.document.delete({ where: { id } });
  revalidatePath("/documents");
  revalidatePath("/");
  redirect("/documents");
}
