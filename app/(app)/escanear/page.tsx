import { redirect } from "next/navigation"
import { ScanView } from "@/components/features/scan-view"
import { getAllPlants } from "@/lib/db/plants"
import { auth } from "@/auth"

export const metadata = {
  title: "Escanear · Secretary Botanic",
}

export default async function EscanearPage() {
  const session = await auth()
  if (!session?.user?.email) {
    redirect("/login")
  }
  const plants = await getAllPlants(session.user.email)
  return <ScanView initialPlants={plants} />
}
