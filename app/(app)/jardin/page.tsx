import { redirect } from "next/navigation"
import { GardenView } from "@/components/features/garden-view"
import { getAllPlants } from "@/lib/db/plants"
import { auth } from "@/auth"

export const metadata = {
  title: "Mi jardín · Secretary Botanic",
}

export default async function JardinPage() {
  const session = await auth()
  if (!session?.user?.email) {
    redirect("/login")
  }
  const plants = await getAllPlants(session.user.email)
  return <GardenView initialPlants={plants} />
}
