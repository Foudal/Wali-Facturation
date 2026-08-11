import Link from "next/link";

const links = [
  { href: "/clients", label: "Clients" },
  { href: "/documents", label: "Devis & factures" },
];

export function Nav() {
  return (
    <header className="site-nav">
      <Link href="/" className="logo">
        Wali<span>Facturation</span>
      </Link>
      <input type="checkbox" id="nav-toggle" className="nav-toggle" />
      <nav className="nav-links">
        {links.map((link) => (
          <Link key={link.href} href={link.href}>
            {link.label}
          </Link>
        ))}
        <Link href="/documents/new" className="cta">
          Nouvelle facture
        </Link>
      </nav>
      <label htmlFor="nav-toggle" className="nav-toggle-label" aria-label="Ouvrir le menu">
        <span></span>
        <span></span>
        <span></span>
      </label>
    </header>
  );
}
