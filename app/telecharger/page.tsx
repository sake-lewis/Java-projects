import { redirect } from "next/navigation"
import { verifierToken, marquerTelechargement } from "@/lib/session/manager"
import TelechargerView from "./TelechargerView"

interface PageProps {
  searchParams: Promise<{ token?: string }>
}

export const dynamic = "force-dynamic"

export default async function TelechargerPage({ searchParams }: PageProps) {
  const { token } = await searchParams
  if (!token) {
    redirect("/error?reason=invalid")
  }

  const session = await verifierToken(token)
  if (!session || !session.pdf_url) {
    redirect("/error?reason=expired")
  }
  if (session.statut !== "ready" && session.statut !== "downloaded") {
    redirect("/error?reason=invalid")
  }

  // À partir du premier affichage de cette page, le lien est consommé : on
  // marque la session "downloaded". Le PDF reste accessible 7 jours côté
  // Cloudinary, mais l'éditeur n'est plus accessible.
  if (session.statut === "ready") {
    await marquerTelechargement(token)
  }

  return (
    <TelechargerView
      pdfUrl={session.pdf_url}
      nomCatalogue={session.nom_catalogue || "catalogue"}
      pdfExpiresAt={session.pdf_expires_at}
    />
  )
}
