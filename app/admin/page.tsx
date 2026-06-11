import { estAdminConnecte } from "@/lib/admin/auth"
import AdminLogin from "./AdminLogin"
import AdminDashboard from "./AdminDashboard"

export const dynamic = "force-dynamic"

export default async function AdminPage() {
  const connecte = await estAdminConnecte()
  return connecte ? <AdminDashboard /> : <AdminLogin />
}
