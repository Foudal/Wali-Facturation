import fs from "node:fs";
import crypto from "node:crypto";
import Database from "better-sqlite3";

// Schéma en dur (miroir de prisma/migrations/20260811161527_init/migration.sql) :
// on ne peut pas lire le fichier de migration depuis le bundle serverless de
// façon fiable (tracing des fichiers non garanti pour un chemin construit
// dynamiquement), donc on l'inline ici. Toute évolution du schéma Prisma
// doit être répercutée dans cette constante.
const SCHEMA_SQL = `
CREATE TABLE "Client" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nom" TEXT NOT NULL,
    "email" TEXT,
    "telephone" TEXT,
    "adresse" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
CREATE TABLE "Document" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "statut" TEXT NOT NULL,
    "dateEmission" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateEcheance" DATETIME,
    "notes" TEXT,
    "devise" TEXT NOT NULL DEFAULT 'EUR',
    "tauxChange" REAL NOT NULL DEFAULT 1.0,
    "tva" REAL NOT NULL DEFAULT 18.0,
    "montantTVA" REAL NOT NULL DEFAULT 0.0,
    "clientId" TEXT NOT NULL,
    "convertedFromId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Document_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Document_convertedFromId_fkey" FOREIGN KEY ("convertedFromId") REFERENCES "Document" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE TABLE "LigneDocument" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "documentId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quantite" REAL NOT NULL DEFAULT 1,
    "prixUnitaire" REAL NOT NULL,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "LigneDocument_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE "Paiement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "documentId" TEXT NOT NULL,
    "montant" REAL NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "methode" TEXT,
    "note" TEXT,
    CONSTRAINT "Paiement_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "Document_numero_key" ON "Document"("numero");
CREATE UNIQUE INDEX "Document_convertedFromId_key" ON "Document"("convertedFromId");
CREATE INDEX "Document_clientId_idx" ON "Document"("clientId");
CREATE INDEX "Document_type_statut_idx" ON "Document"("type", "statut");
`;

function id() {
  return crypto.randomUUID();
}

function iso(date: string) {
  return new Date(date).toISOString();
}

/**
 * (Re)crée une base SQLite de démo à `path` si elle n'existe pas encore.
 * Idempotent et synchrone (better-sqlite3) : appelée au chargement du
 * module `prisma.ts`, avant toute requête Prisma.
 */
export function bootstrapVercelDatabase(path: string) {
  if (fs.existsSync(path)) return;

  const db = new Database(path);
  try {
    db.exec(SCHEMA_SQL);
    seedDemoData(db);
  } finally {
    db.close();
  }
}

function seedDemoData(db: Database.Database) {
  const now = new Date().toISOString();
  const year = new Date().getFullYear();

  const insertClient = db.prepare(
    `INSERT INTO "Client" (id, nom, email, telephone, adresse, createdAt, updatedAt)
     VALUES (@id, @nom, @email, @telephone, @adresse, @createdAt, @updatedAt)`,
  );
  const insertDocument = db.prepare(
    `INSERT INTO "Document" (id, type, numero, statut, dateEmission, dateEcheance, notes, clientId, createdAt, updatedAt)
     VALUES (@id, @type, @numero, @statut, @dateEmission, @dateEcheance, @notes, @clientId, @createdAt, @updatedAt)`,
  );
  const insertLigne = db.prepare(
    `INSERT INTO "LigneDocument" (id, documentId, description, quantite, prixUnitaire, ordre)
     VALUES (@id, @documentId, @description, @quantite, @prixUnitaire, @ordre)`,
  );
  const insertPaiement = db.prepare(
    `INSERT INTO "Paiement" (id, documentId, montant, date, methode)
     VALUES (@id, @documentId, @montant, @date, @methode)`,
  );

  const clients = [
    { id: id(), nom: "Atelier Nour SARL", email: "contact@ateliernour.fr", telephone: "06 12 34 56 78", adresse: "14 rue des Artisans, 75011 Paris" },
    { id: id(), nom: "Studio Ferrand", email: "hello@studioferrand.fr", telephone: "07 22 33 44 55", adresse: "3 avenue de la République, 69003 Lyon" },
    { id: id(), nom: "Café des Lilas", email: "gerance@cafedeslilas.fr", telephone: "06 98 76 54 32", adresse: "22 rue des Lilas, 33000 Bordeaux" },
  ];
  for (const c of clients) {
    insertClient.run({ ...c, createdAt: now, updatedAt: now });
  }

  function addDocument(opts: {
    type: "DEVIS" | "FACTURE";
    numero: string;
    statut: string;
    clientId: string;
    dateEmission: string;
    dateEcheance?: string;
    notes?: string;
    devise?: string;
    tauxChange?: number;
    tva?: number;
    lignes: { description: string; quantite: number; prixUnitaire: number }[];
    paiements?: { montant: number; date: string; methode: string }[];
  }) {
    const documentId = id();
    const devise = opts.devise ?? "EUR";
    const tauxChange = opts.tauxChange ?? 1.0;
    const tva = opts.tva ?? 18.0;
    const subtotal = opts.lignes.reduce((sum, l) => sum + l.quantite * l.prixUnitaire, 0);
    const montantTVA = Math.round(subtotal * (tva / 100) * 100) / 100;

    insertDocument.run({
      id: documentId,
      type: opts.type,
      numero: opts.numero,
      statut: opts.statut,
      dateEmission: iso(opts.dateEmission),
      dateEcheance: opts.dateEcheance ? iso(opts.dateEcheance) : null,
      notes: opts.notes ?? null,
      devise,
      tauxChange,
      tva,
      montantTVA,
      clientId: opts.clientId,
      createdAt: now,
      updatedAt: now,
    });
    opts.lignes.forEach((l, ordre) => insertLigne.run({ id: id(), documentId, ordre, ...l }));
    (opts.paiements ?? []).forEach((p) =>
      insertPaiement.run({ id: id(), documentId, montant: p.montant, date: iso(p.date), methode: p.methode }),
    );
  }

  addDocument({
    type: "FACTURE",
    numero: `WF-${year}-0143`,
    statut: "PAYEE",
    clientId: clients[0].id,
    dateEmission: "2026-07-25",
    dateEcheance: "2026-08-25",
    devise: "GNF",
    tva: 18.0,
    lignes: [
      { description: "Refonte identité visuelle", quantite: 1, prixUnitaire: 2700000 },
      { description: "Déclinaison supports imprimés", quantite: 1, prixUnitaire: 540000 },
    ],
    paiements: [{ montant: 3888000, date: "2026-08-10", methode: "virement" }],
  });

  addDocument({
    type: "FACTURE",
    numero: `WF-${year}-0144`,
    statut: "ENVOYEE",
    clientId: clients[1].id,
    dateEmission: "2026-08-01",
    dateEcheance: "2026-08-31",
    devise: "USD",
    tva: 0.0,
    lignes: [{ description: "Séance photo produit (demi-journée)", quantite: 1, prixUnitaire: 1180 }],
  });

  addDocument({
    type: "FACTURE",
    numero: `WF-${year}-0145`,
    statut: "EN_RETARD",
    clientId: clients[2].id,
    dateEmission: "2026-06-15",
    dateEcheance: "2026-07-15",
    devise: "EUR",
    tva: 20.0,
    lignes: [{ description: "Menu & signalétique terrasse", quantite: 1, prixUnitaire: 620 }],
  });

  addDocument({
    type: "DEVIS",
    numero: `DV-${year}-0012`,
    statut: "ENVOYE",
    clientId: clients[1].id,
    dateEmission: "2026-08-08",
    dateEcheance: "2026-09-08",
    devise: "USD",
    tva: 0.0,
    notes: "En attente de validation du client avant démarrage.",
    lignes: [
      { description: "Refonte site vitrine (5 pages)", quantite: 1, prixUnitaire: 2400 },
      { description: "Formation prise en main", quantite: 2, prixUnitaire: 150 },
    ],
  });
}
