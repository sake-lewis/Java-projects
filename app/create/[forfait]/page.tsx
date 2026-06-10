import { redirect } from "next/navigation"
import { verifierToken } from "@/lib/session/manager"
import { Forfait } from "@/types"

interface PageProps {
  params: Promise<{ forfait: string }>
  searchParams: Promise<{ token?: string }>
}

export default async function CreatePage({ params, searchParams }: PageProps) {
  const { forfait } = await params
  const { token } = await searchParams

  // 1. Valider le forfait
  if (forfait !== "standard" && forfait !== "pro" && forfait !== "premium") {
    redirect("/error")
  }

  // 2. Si token absent
  if (!token) {
    redirect("/error")
  }

  // 3. Valider le token
  const session = await verifierToken(token)

  // 4. Vérifications supplémentaires
  if (!session || session.forfait !== forfait) {
    redirect("/error")
  }

  // 5. Redirection selon le statut.
  // "paid"     = ancien flux test sans /merci
  // "claimed"  = réclamée sur /merci (nouveau flux Chariow) → on entre direct dans l'éditeur
  // "generating" = relance après échec PDF
  switch (session.statut) {
    case "paid":
      redirect(`/create/${forfait}/start?token=${token}`)
    case "claimed":
    case "generating":
    case "ready":
    case "downloaded":
      redirect(`/create/${forfait}/editor?token=${token}`)
    case "expired":
    default:
      redirect("/error")
  }
}
