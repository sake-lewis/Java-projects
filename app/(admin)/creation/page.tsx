import Link from "next/link";
import BloomMark from "@/components/ui/BloomMark";

export const dynamic = "force-dynamic";

// ============================================================
// Écran « Création » — point d'entrée de la production.
// 3 interfaces de création, une par forfait, chacune dans son univers.
// ============================================================

const CARTES = [
  {
    forfait: "basic",
    label: "Basic",
    prix: "500 F",
    produits: "20–25 produits",
    credits: "3 modifications incluses",
    niveau: "Design simple, couleurs sobres",
    // Univers visuel de l'interface Basic : vert Everbloom (mode sombre)
    classes: "bg-[#16241D] border-[#4E8F6F]/40 hover:border-[#4E8F6F]",
    pastille: "bg-[#4E8F6F]",
    texte: "text-[#7FBF9E]",
  },
  {
    forfait: "standard",
    label: "Standard",
    prix: "750 F",
    produits: "35 produits",
    credits: "6 modifications incluses",
    niveau: "Design avancé, palette du secteur",
    // Univers Standard : bronze / or mat (mode sombre)
    classes: "bg-[#241C12] border-[#C4956A]/40 hover:border-[#C4956A]",
    pastille: "bg-[#C4956A]",
    texte: "text-[#C4956A]",
  },
  {
    forfait: "premium",
    label: "Premium",
    prix: "1 000 F",
    produits: "50 produits",
    credits: "10 modifications incluses",
    niveau: "Personnalisation pro + sections bonus",
    // Univers Premium : noir & or (mode sombre)
    classes: "bg-[#0C0A07] border-[#C9A35C]/60 hover:border-[#C9A35C] text-[#F0E6D2]",
    pastille: "bg-[#C9A35C]",
    texte: "text-[#C9A35C]",
  },
] as const;

export default function CreationPage() {
  return (
    <div className="animate-fade-up max-w-lg mx-auto">
      <div className="flex flex-col items-center text-center mb-8">
        <BloomMark className="w-10 h-10 text-[var(--color-or)]" />
        <div className="eyebrow mt-3">Nouvelle création</div>
        <h1 className="display text-3xl mt-1">Quel forfait a payé le client ?</h1>
        <p className="text-sm opacity-60 mt-2">
          L&apos;espace de travail s&apos;adapte automatiquement au forfait choisi.
        </p>
      </div>

      <div className="space-y-4">
        {CARTES.map((c) => (
          <Link
            key={c.forfait}
            href={`/clients/nouveau?forfait=${c.forfait}`}
            className={`block border-2 rounded-2xl p-5 transition-all hover:scale-[1.01] active:scale-[0.99] ${c.classes}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className={`w-3 h-3 rounded-full ${c.pastille}`} />
                <span className="font-bold text-xl">{c.label}</span>
              </div>
              <span className={`font-bold text-xl ${c.texte}`}>{c.prix}</span>
            </div>
            <div className="mt-3 text-sm opacity-75 space-y-0.5">
              <div>{c.produits} · {c.credits}</div>
              <div>{c.niveau}</div>
            </div>
          </Link>
        ))}
      </div>

      <p className="text-center text-xs opacity-40 mt-8">
        Le client existe déjà ? Retrouve-le sur le{" "}
        <Link href="/" className="underline underline-offset-2">tableau de bord</Link>.
      </p>
    </div>
  );
}
