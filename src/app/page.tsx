import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { StatutBadge } from "@/components/statut-badge";
import { computeTotal, computeEncaisse, effectiveStatut } from "@/lib/documents";
import { formatMontant, formatDate } from "@/lib/format";

// Le tableau de bord reflète l'état de la base à chaque requête (paiements,
// nouvelles factures) : pas de mise en cache statique au build.
export const dynamic = "force-dynamic";

export default async function Home() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [encaissementsCeMois, factures, dernieresFactures] = await Promise.all([
    prisma.paiement.aggregate({
      _sum: { montant: true },
      where: { date: { gte: startOfMonth } },
    }),
    prisma.document.findMany({
      where: { type: "FACTURE" },
      include: { lignes: true, paiements: true },
    }),
    prisma.document.findMany({
      where: { type: "FACTURE" },
      include: { client: true, lignes: true, paiements: true },
      orderBy: { dateEmission: "desc" },
      take: 4,
    }),
  ]);

  const encaisseMois = encaissementsCeMois._sum.montant ?? 0;

  const enAttente = factures.reduce((sum, f) => {
    const total = computeTotal(f.lignes);
    const encaisse = computeEncaisse(f.paiements);
    const solde = total - encaisse;
    const statut = effectiveStatut(f, solde);
    return statut === "ENVOYEE" || statut === "EN_RETARD" ? sum + solde : sum;
  }, 0);

  const hasData = factures.length > 0;

  return (
    <div>
      <div className="hero-wrap">
        <div className="gradient-band" />
        <div className="hero-content">
          <span className="eyebrow">Wali-Facturation</span>
          <h1>La facturation, sans la paperasse.</h1>
          <p>
            Créez vos devis et factures en quelques clics, suivez vos paiements en temps réel et laissez
            Wali relancer vos clients pour vous.
          </p>
          <div className="hero-actions">
            <Link href="/documents/new" className="btn-white">
              Créer une facture
            </Link>
            <Link href="/clients" className="btn-outline-light">
              Voir mes clients
            </Link>
          </div>
        </div>

        <div className="mock-card-shell">
          <div className="mock-card">
            <div className="invoice-panel">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                Factures récentes
              </p>
              {hasData ? (
                dernieresFactures.map((f) => {
                  const total = computeTotal(f.lignes);
                  return (
                    <div key={f.id} className="row">
                      <span>
                        {f.numero} · {f.client.nom}
                      </span>
                      <strong>{formatMontant(total)}</strong>
                    </div>
                  );
                })
              ) : (
                <p className="py-6 text-sm text-[var(--muted)]">
                  Aucune facture pour l&apos;instant — créez la première.
                </p>
              )}
            </div>
            <div className="status-panel">
              <p className="text-xs uppercase tracking-wide text-[var(--muted)]">Encaissé ce mois-ci</p>
              <p className="text-2xl font-bold text-[var(--ink-2)]">{formatMontant(encaisseMois)}</p>
              <p className="mt-2 text-xs uppercase tracking-wide text-[var(--muted)]">En attente de paiement</p>
              <p className="text-lg font-bold text-[var(--ink)]">{formatMontant(enAttente)}</p>
            </div>
          </div>
        </div>
      </div>

      <section className="home-features">
        <Link href="/documents/new" className="block">
          <div className="icon" />
          <h3 className="text-lg font-bold text-[var(--ink-2)]">Devis → Facture en 1 clic</h3>
          <p className="mt-2.5 text-sm leading-relaxed text-[var(--muted)]">
            Transformez un devis accepté en facture conforme sans ressaisir la moindre ligne.
          </p>
        </Link>
        <Link href="/clients" className="block">
          <div className="icon" />
          <h3 className="text-lg font-bold text-[var(--ink-2)]">Gestion clients</h3>
          <p className="mt-2.5 text-sm leading-relaxed text-[var(--muted)]">
            Centralisez vos clients et retrouvez tout leur historique de facturation.
          </p>
        </Link>
        <Link href="/documents" className="block">
          <div className="icon" />
          <h3 className="text-lg font-bold text-[var(--ink-2)]">Suivi de trésorerie</h3>
          <p className="mt-2.5 text-sm leading-relaxed text-[var(--muted)]">
            Visualisez encaissé, en attente et en retard sur un seul tableau de bord.
          </p>
        </Link>
      </section>

      {hasData && (
        <section className="mx-auto max-w-5xl px-5 pb-20 sm:px-8">
          <div className="mt-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-[var(--ink-2)]">Dernières factures</h2>
            <Link href="/documents" className="text-sm font-semibold text-[var(--brand)]">
              Tout voir →
            </Link>
          </div>
          <div className="card mt-4 divide-y divide-[var(--line)] overflow-hidden">
            {dernieresFactures.map((f) => {
              const total = computeTotal(f.lignes);
              const encaisse = computeEncaisse(f.paiements);
              const statut = effectiveStatut(f, total - encaisse);
              return (
                <Link
                  key={f.id}
                  href={`/documents/${f.id}`}
                  className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 hover:bg-gray-50 sm:px-6"
                >
                  <div>
                    <p className="font-semibold text-[var(--ink-2)]">
                      {f.numero} <span className="font-normal text-[var(--muted)]">· {f.client.nom}</span>
                    </p>
                    <p className="text-xs text-[var(--muted)]">{formatDate(f.dateEmission)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-[var(--ink)]">{formatMontant(total)}</span>
                    <StatutBadge statut={statut} />
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
