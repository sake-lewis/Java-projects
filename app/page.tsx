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

      <div className="animate-fade-up relative z-10 flex w-full max-w-2xl flex-col items-center text-center">
        <BloomMark className="h-12 w-12 text-or" />
        <div className="wordmark mt-4 text-xl">EVERBLOOM</div>
        <div className="hairline-or mt-3 w-24" />

        <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-or/40 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-or">
          Mode développement
        </div>

        <h1 className="display mt-6 text-3xl text-vert sm:text-4xl">
          Simuler une session payée
        </h1>
        <p className="mt-3 max-w-md text-[15px] leading-relaxed text-vert/60">
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
                  className="group card focus-ring flex w-full flex-col items-center gap-1 px-6 py-6 text-center transition-all hover:-translate-y-0.5 hover:border-vert hover:shadow-lg"
                >
                  <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-or">
                    {POSITIONNEMENT[forfait]}
                  </span>
                  <span className="display text-[22px] text-vert">
                    {config.label}
                  </span>
                  <span className="text-sm tabular-nums text-vert/55">
                    {config.prix.toLocaleString("fr-FR")} FCFA
                  </span>
                  <span className="mt-1 text-[11px] text-vert/45">
                    {config.photos_max} photos · {config.styles_disponibles.length} styles
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
