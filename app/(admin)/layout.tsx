import Link from "next/link";
import { redirect } from "next/navigation";
import { estConnecte } from "@/lib/admin/auth";
import BloomMark from "@/components/ui/BloomMark";
import BoutonDeconnexion from "@/components/BoutonDeconnexion";
import NavigationBas from "@/components/NavigationBas";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!(await estConnecte())) redirect("/login");

  return (
    <>
      <header className="sticky top-0 z-40 bg-[var(--color-ivoire)]/90 backdrop-blur border-b border-[rgba(231,225,211,0.1)]">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <BloomMark className="w-6 h-6 text-[var(--color-or)]" />
            <span className="wordmark text-sm">EVERBLOOM</span>
          </Link>
          <nav className="flex items-center gap-2">
            <Link
              href="/creation"
              className="text-sm font-semibold px-3 py-2 rounded-lg bg-[var(--color-vert)] text-[var(--color-ivoire)] hover:opacity-90"
            >
              + Créer
            </Link>
            <BoutonDeconnexion />
          </nav>
        </div>
      </header>
      <main className="flex-1 w-full max-w-3xl mx-auto px-4 py-6 pb-24">{children}</main>
      <NavigationBas />
    </>
  );
}
