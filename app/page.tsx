import Link from "next/link";
import BloomMark from "@/components/ui/BloomMark";
import { FORFAIT_CONFIG, Forfait } from "@/types";

const FORFAITS: Forfait[] = ["standard", "pro", "premium"];

const POSITIONNEMENT: Record<Forfait, string> = {
  standard: "Sobre & élégant",
  pro: "Impressionnant",
  premium: "Luxueux",
};

export default function Home() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#E8E0D5] px-6 py-16">
      <BloomMark
        strokeWidth={0.8}
        className="pointer-events-none absolute -right-28 -top-28 h-[460px] w-[460px] text-[#1E4D3A]/[0.05]"
      />

      <div className="relative z-10 flex w-full max-w-2xl flex-col items-center text-center">
        <BloomMark className="h-12 w-12 text-[#C4956A]" />
        <div className="mt-4 text-xl font-semibold tracking-[0.32em] text-[#1E4D3A]">
          EVERBLOOM
        </div>

        <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-[#C4956A]/40 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-[#C4956A]">
          Mode développement
        </div>

        <h1 className="mt-6 text-2xl font-semibold tracking-tight text-[#1E4D3A] sm:text-3xl">
          Simuler une session payée
        </h1>
        <p className="mt-3 max-w-md text-[15px] leading-relaxed text-[#1E4D3A]/60">
          Choisissez un forfait pour créer une session de test. Une session réelle
          sera enregistrée dans Firestore.
        </p>

        <div className="mt-10 grid w-full gap-4 sm:grid-cols-3">
          {FORFAITS.map((forfait) => {
            const config = FORFAIT_CONFIG[forfait];
            return (
              <form
                key={forfait}
                action={`/api/debug-session?forfait=${forfait}`}
                method="POST"
              >
                <button
                  type="submit"
                  className="group flex w-full flex-col items-center gap-1 rounded-xl border border-[#C4956A]/30 bg-[#F5F0EA] px-6 py-6 text-center transition-all hover:-translate-y-0.5 hover:border-[#1E4D3A] hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E4D3A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#E8E0D5]"
                >
                  <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#C4956A]">
                    {POSITIONNEMENT[forfait]}
                  </span>
                  <span className="text-lg font-semibold text-[#1E4D3A]">
                    {config.label}
                  </span>
                  <span className="text-sm text-[#1E4D3A]/55">
                    {config.prix.toLocaleString("fr-FR")} FCFA
                  </span>
                </button>
              </form>
            );
          })}
        </div>

        <Link
          href="/error"
          className="mt-8 text-[13px] text-[#1E4D3A]/45 underline-offset-4 hover:underline"
        >
          Voir la page d&apos;erreur
        </Link>
      </div>
    </main>
  );
}
