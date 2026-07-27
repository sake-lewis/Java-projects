"use client";

import { useRouter } from "next/navigation";

export default function BoutonDeconnexion() {
  const router = useRouter();

  async function deconnecter() {
    await fetch("/api/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  return (
    <button
      onClick={deconnecter}
      className="text-sm px-3 py-2 rounded-lg opacity-60 hover:opacity-100 hover:bg-[rgba(231,225,211,0.06)]"
      title="Se déconnecter"
    >
      Quitter
    </button>
  );
}
