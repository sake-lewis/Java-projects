import { redirect } from "next/navigation"
import { verifierToken } from "@/lib/session/manager"

interface PageProps {
  params: Promise<{ forfait: string }>
  searchParams: Promise<{ token?: string }>
}

export default async function CreatePage({ params, searchParams }: PageProps) {
  const { forfait } = await params
  const { token } = await searchParams

  if (forfait !== "standard" && forfait !== "pro" && forfait !== "premium") {
    redirect("/error?reason=invalid")
  }
  if (!token) {
    redirect("/error?reason=invalid")
  }

  const session = await verifierToken(token)
  if (!session || session.forfait !== forfait) {
    redirect("/error?reason=invalid")
  }

  // Nouveau workflow (lien admin) : la session est créée directement en `paid`
  // par l'admin, le client tombe donc dans l'éditeur sans passer par /start.
  // Une fois le PDF généré (`ready`/`downloaded`), le lien est consommé :
  // le client est envoyé sur /telecharger pour les visites suivantes.
  switch (session.statut) {
    case "paid":
    case "claimed":
    case "generating":
      redirect(`/create/${forfait}/editor?token=${token}`)
    case "ready":
    case "downloaded":
      redirect(`/telecharger?token=${token}`)
    case "expired":
    default:
      redirect("/error?reason=expired")
  }
}
