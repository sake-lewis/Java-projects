import { redirect } from "next/navigation"
import { verifierToken } from "@/lib/session/manager"
import StartStandard from "@/components/pages/StartStandard"
import StartPro from "@/components/pages/StartPro"
import StartPremium from "@/components/pages/StartPremium"

interface PageProps {
  params: Promise<{ forfait: string }>
  searchParams: Promise<{ token?: string }>
}

export default async function StartPage({ params, searchParams }: PageProps) {
  const { forfait } = await params
  const { token } = await searchParams

  if (!token) redirect("/error")
  if (forfait !== "standard" && forfait !== "pro" && forfait !== "premium") {
    redirect("/error")
  }

  const session = await verifierToken(token)
  if (!session || session.forfait !== forfait) redirect("/error")
  if (session.statut === "expired") redirect("/error")

  if (forfait === "standard") return <StartStandard token={token} />
  if (forfait === "pro") return <StartPro token={token} />
  return <StartPremium token={token} />
}