-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Document" (
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
INSERT INTO "new_Document" ("clientId", "convertedFromId", "createdAt", "dateEcheance", "dateEmission", "id", "notes", "numero", "statut", "type", "updatedAt") SELECT "clientId", "convertedFromId", "createdAt", "dateEcheance", "dateEmission", "id", "notes", "numero", "statut", "type", "updatedAt" FROM "Document";
DROP TABLE "Document";
ALTER TABLE "new_Document" RENAME TO "Document";
CREATE UNIQUE INDEX "Document_numero_key" ON "Document"("numero");
CREATE UNIQUE INDEX "Document_convertedFromId_key" ON "Document"("convertedFromId");
CREATE INDEX "Document_clientId_idx" ON "Document"("clientId");
CREATE INDEX "Document_type_statut_idx" ON "Document"("type", "statut");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
