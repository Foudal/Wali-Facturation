import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL ?? "file:./dev.db" });
const prisma = new PrismaClient({ adapter });

async function numero(type: "DEVIS" | "FACTURE", n: number) {
  const year = new Date().getFullYear();
  const prefix = type === "DEVIS" ? "DV" : "WF";
  return `${prefix}-${year}-${String(n).padStart(4, "0")}`;
}

async function main() {
  await prisma.paiement.deleteMany();
  await prisma.ligneDocument.deleteMany();
  await prisma.document.deleteMany();
  await prisma.client.deleteMany();

  const clients = await Promise.all([
    prisma.client.create({
      data: {
        nom: "Atelier Nour SARL",
        email: "contact@ateliernour.fr",
        telephone: "06 12 34 56 78",
        adresse: "14 rue des Artisans, 75011 Paris",
      },
    }),
    prisma.client.create({
      data: {
        nom: "Studio Ferrand",
        email: "hello@studioferrand.fr",
        telephone: "07 22 33 44 55",
        adresse: "3 avenue de la République, 69003 Lyon",
      },
    }),
    prisma.client.create({
      data: {
        nom: "Café des Lilas",
        email: "gerance@cafedeslilas.fr",
        telephone: "06 98 76 54 32",
        adresse: "22 rue des Lilas, 33000 Bordeaux",
      },
    }),
  ]);

  const facture1 = await prisma.document.create({
    data: {
      type: "FACTURE",
      numero: await numero("FACTURE", 143),
      statut: "PAYEE",
      dateEmission: new Date("2026-07-25"),
      dateEcheance: new Date("2026-08-25"),
      clientId: clients[0].id,
      lignes: {
        create: [
          { description: "Refonte identité visuelle", quantite: 1, prixUnitaire: 2700, ordre: 0 },
          { description: "Déclinaison supports imprimés", quantite: 1, prixUnitaire: 540, ordre: 1 },
        ],
      },
      paiements: {
        create: [{ montant: 3240, date: new Date("2026-08-10"), methode: "virement" }],
      },
    },
  });

  await prisma.document.create({
    data: {
      type: "FACTURE",
      numero: await numero("FACTURE", 144),
      statut: "ENVOYEE",
      dateEmission: new Date("2026-08-01"),
      dateEcheance: new Date("2026-08-31"),
      clientId: clients[1].id,
      lignes: {
        create: [{ description: "Séance photo produit (demi-journée)", quantite: 1, prixUnitaire: 1180, ordre: 0 }],
      },
    },
  });

  await prisma.document.create({
    data: {
      type: "FACTURE",
      numero: await numero("FACTURE", 145),
      statut: "EN_RETARD",
      dateEmission: new Date("2026-06-15"),
      dateEcheance: new Date("2026-07-15"),
      clientId: clients[2].id,
      lignes: {
        create: [{ description: "Menu & signalétique terrasse", quantite: 1, prixUnitaire: 620, ordre: 0 }],
      },
    },
  });

  await prisma.document.create({
    data: {
      type: "DEVIS",
      numero: await numero("DEVIS", 12),
      statut: "ENVOYE",
      dateEmission: new Date("2026-08-08"),
      dateEcheance: new Date("2026-09-08"),
      clientId: clients[1].id,
      notes: "En attente de validation du client avant démarrage.",
      lignes: {
        create: [
          { description: "Refonte site vitrine (5 pages)", quantite: 1, prixUnitaire: 2400, ordre: 0 },
          { description: "Formation prise en main", quantite: 2, prixUnitaire: 150, ordre: 1 },
        ],
      },
    },
  });

  console.log("Seed terminé:", { clients: clients.length, exemple: facture1.numero });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
