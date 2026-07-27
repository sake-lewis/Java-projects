"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  async function seConnecter(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);
    setEnCours(true);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        router.replace("/");
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        setErreur(data.error || "Mot de passe incorrect");
      }
    } catch {
      setErreur("Connexion impossible. Vérifie ta connexion Internet.");
    } finally {
      setEnCours(false);
    }
  }

  return (
    <form onSubmit={seConnecter} className="space-y-4">
      <label className="block">
        <span className="text-sm font-medium">Mot de passe</span>
        <input
          type="password"
          className="field mt-2"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoFocus
          autoComplete="current-password"
        />
      </label>
      {erreur && <p className="text-sm text-[var(--color-erreur)]">{erreur}</p>}
      <button className="btn-primary w-full" disabled={enCours || !password}>
        {enCours ? "Connexion…" : "Entrer"}
      </button>
    </form>
  );
}
