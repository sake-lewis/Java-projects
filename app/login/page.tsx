import { redirect } from "next/navigation";
import { estConnecte } from "@/lib/admin/auth";
import LoginForm from "@/components/LoginForm";
import BloomMark from "@/components/ui/BloomMark";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  if (await estConnecte()) redirect("/");

  return (
    <main className="flex-1 flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm animate-fade-up">
        <div className="flex flex-col items-center mb-8">
          <BloomMark className="w-14 h-14 text-[var(--color-or)]" />
          <div className="wordmark mt-4 text-lg">EVERBLOOM</div>
          <div className="eyebrow mt-1">Catalogues digitaux</div>
        </div>
        <div className="card p-6">
          <LoginForm />
        </div>
        <p className="text-center text-xs mt-6 opacity-50">
          Espace de production réservé à l&apos;opérateur.
        </p>
      </div>
    </main>
  );
}
