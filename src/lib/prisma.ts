import { PrismaClient } from "@/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { bootstrapVercelDatabase } from "./vercel-db-bootstrap";

declare global {
  var __prisma: PrismaClient | undefined;
}

// Sur Vercel, le système de fichiers du déploiement est en lecture seule ;
// seul /tmp est accessible en écriture, et il est éphémère (vidé à chaque
// nouvelle instance serverless). SQLite y reste utilisable pour une preview
// de démo (pas d'accès concurrent multi-instance fiable, pas de persistance
// durable) : bootstrapVercelDatabase() (re)crée le schéma + les données de
// démo au premier accès de chaque instance froide.
const isVercel = !!process.env.VERCEL;
const databaseUrl = isVercel ? "file:/tmp/dev.db" : process.env.DATABASE_URL ?? "file:./dev.db";

if (isVercel) {
  bootstrapVercelDatabase("/tmp/dev.db");
}

function createClient() {
  const adapter = new PrismaBetterSqlite3({ url: databaseUrl });
  return new PrismaClient({ adapter });
}

export const prisma = globalThis.__prisma ?? createClient();

if (process.env.NODE_ENV !== "production" || isVercel) {
  globalThis.__prisma = prisma;
}
