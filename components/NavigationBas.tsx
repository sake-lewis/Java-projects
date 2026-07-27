"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// ============================================================
// Barre de navigation de production — toujours à portée de pouce.
// Masquée dans l'éditeur de catalogue (qui a sa propre barre
// « Générer le PDF » en bas d'écran).
// ============================================================

const ONGLETS = [
  {
    href: "/",
    label: "Tableau",
    icone: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
        <rect x="3" y="3" width="7.5" height="7.5" rx="1.5" />
        <rect x="13.5" y="3" width="7.5" height="7.5" rx="1.5" />
        <rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5" />
        <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.5" />
      </svg>
    ),
  },
  {
    href: "/creation",
    label: "Créer",
    icone: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v8M8 12h8" />
      </svg>
    ),
  },
  {
    href: "/suivi",
    label: "Suivi",
    icone: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3.5 2" />
      </svg>
    ),
  },
];

export default function NavigationBas() {
  const pathname = usePathname();

  // L'éditeur de catalogue a sa propre barre fixe en bas
  if (pathname.startsWith("/catalogues/")) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[var(--color-ivoire)]/95 backdrop-blur border-t border-[rgba(231,225,211,0.12)]">
      <div className="max-w-3xl mx-auto grid grid-cols-3">
        {ONGLETS.map((o) => {
          const actif =
            o.href === "/" ? pathname === "/" : pathname.startsWith(o.href);
          return (
            <Link
              key={o.href}
              href={o.href}
              className={`flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-semibold transition-colors ${
                actif
                  ? "text-[var(--color-vert)]"
                  : "text-[var(--color-vert)]/45 hover:text-[var(--color-vert)]/70"
              }`}
            >
              {o.icone}
              {o.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
