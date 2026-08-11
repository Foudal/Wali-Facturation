# Wali-Facturation

MVP de facturation pour indépendants et petites entreprises : clients, devis,
factures, suivi de paiements. Next.js (App Router) + Prisma + SQLite, sans
dépendance externe pour démarrer.

## Démarrer en local

```bash
npm install
npm run db:seed   # crée dev.db, applique les migrations et ajoute des données de démo
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000).

`npm run db:seed` exécute `prisma migrate deploy` implicitement au premier
lancement si `dev.db` n'existe pas encore — sinon lancez d'abord
`npx prisma migrate dev`.

## Fonctionnalités (v1)

- **Clients** : créer / modifier / supprimer (si aucun document rattaché)
- **Devis & factures** : création avec lignes dynamiques (ajout/retrait),
  numérotation automatique (`DV-AAAA-NNNN` / `WF-AAAA-NNNN`), édition tant
  que le document est en brouillon
- **Cycle de vie** : brouillon → envoyé(e) → accepté/refusé (devis) ou
  payée/en retard/annulée (facture)
- **Conversion devis → facture** en un clic (copie les lignes, ne modifie
  jamais le devis d'origine)
- **Paiements** : enregistrement partiel ou total, passage automatique en
  « Payée » quand le solde atteint zéro
- **Tableau de bord** : encaissé du mois, montant en attente, dernières
  factures — calculés en direct depuis la base
- **Export** : aperçu imprimable par facture/devis, utilisable comme PDF via
  « Imprimer → Enregistrer en PDF » du navigateur

## Limites connues (à traiter avant une vraie mise en production)

- **Pas d'authentification** — l'app est mono-utilisateur en l'état, toute
  personne ayant accès à l'URL voit toutes les données.
- **SQLite local** (`dev.db`, non versionné) — adapté au développement et à
  la démo, pas à plusieurs utilisateurs concurrents ni à un déploiement
  multi-instance. Migration vers Postgres (Supabase, Neon…) recommandée
  avant prod : il suffit de changer le provider Prisma et la variable
  `DATABASE_URL`, le reste du code ne change pas.
- **Mentions légales des factures** (SIRET, TVA, pénalités de retard) :
  volontairement laissées en placeholder explicite dans la page imprimable
  plutôt que d'inventer des données — à compléter avec les vraies
  informations de l'émetteur.
- **Export PDF** via impression navigateur, pas de génération PDF
  programmatique (pas de génération en masse ni d'envoi automatique par
  email pour l'instant).
- **Statut « en retard »** calculé à l'affichage (échéance dépassée + solde
  non nul), pas de relance automatique envoyée pour l'instant.

## Stack

- [Next.js 16](https://nextjs.org) (App Router, Server Actions, TypeScript)
- [Prisma 7](https://www.prisma.io) + SQLite (adapter `better-sqlite3`)
- Tailwind CSS 4

## Structure

```
prisma/schema.prisma       Modèle de données (Client, Document, LigneDocument, Paiement)
prisma/seed.ts             Données de démonstration
src/app/                   Pages (App Router) + Server Actions
src/components/            Composants partagés (formulaires, nav, badges)
src/lib/                   Prisma client, calculs (totaux, statuts), constantes
design-demos/              Prototypes de direction visuelle (voir plus bas)
```

## Prototypes de design

Le dossier `design-demos/test-homepage/` contient les 3 directions visuelles
explorées avant le développement (voir `direction-approved.md`) — Direction 2
(inspirée Stripe) a été retenue et est celle utilisée dans l'app réelle
(`src/app/page.tsx`, `src/components/nav.tsx`, `globals.css`).
