"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function str(formData: FormData, key: string): string {
  return (formData.get(key) as string | null)?.trim() ?? "";
}

export async function createClientAction(formData: FormData) {
  const nom = str(formData, "nom");
  if (!nom) {
    throw new Error("Le nom du client est obligatoire.");
  }

  const client = await prisma.client.create({
    data: {
      nom,
      email: str(formData, "email") || null,
      telephone: str(formData, "telephone") || null,
      adresse: str(formData, "adresse") || null,
    },
  });

  revalidatePath("/clients");
  redirect(`/clients/${client.id}`);
}

export async function updateClientAction(id: string, formData: FormData) {
  const nom = str(formData, "nom");
  if (!nom) {
    throw new Error("Le nom du client est obligatoire.");
  }

  await prisma.client.update({
    where: { id },
    data: {
      nom,
      email: str(formData, "email") || null,
      telephone: str(formData, "telephone") || null,
      adresse: str(formData, "adresse") || null,
    },
  });

  revalidatePath("/clients");
  revalidatePath(`/clients/${id}`);
  redirect(`/clients/${id}`);
}

export async function deleteClientAction(id: string) {
  const documentCount = await prisma.document.count({ where: { clientId: id } });
  if (documentCount > 0) {
    throw new Error(
      `Impossible de supprimer ce client : ${documentCount} devis/facture(s) lui sont rattaché(s).`,
    );
  }
  await prisma.client.delete({ where: { id } });
  revalidatePath("/clients");
  redirect("/clients");
}
