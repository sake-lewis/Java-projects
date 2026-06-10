import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#E8E0D5] p-6 text-center">
      <h1 className="mb-8 text-4xl font-bold text-[#1E4D3A]" style={{ fontFamily: 'serif' }}>
        EVERBLOOM - Mode Développement
      </h1>
      <p className="mb-12 text-[#555555]">
        Choisissez un forfait pour simuler une session de test.
      </p>
      
      <div className="grid gap-6 sm:grid-cols-3">
        {["standard", "pro", "premium"].map((forfait) => (
          <form key={forfait} action={`/api/debug-session?forfait=${forfait}`} method="POST">
            <button
              type="submit"
              className="w-full rounded-md bg-[#1E4D3A] px-8 py-4 font-semibold text-[#E8E0D5] transition-all hover:scale-105 active:scale-95"
            >
              Tester Forfait {forfait.toUpperCase()}
            </button>
          </form>
        ))}
      </div>
      
      <p className="mt-12 text-sm text-[#888888]">
        Note : Cela va créer une session réelle dans votre Firestore.
      </p>
    </div>
  );
}
