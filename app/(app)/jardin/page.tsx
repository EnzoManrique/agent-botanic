import { redirect } from "next/navigation"
import { GardenView } from "@/components/features/garden-view"
import { getAllPlants } from "@/lib/store"
import { auth } from "@/auth"

export const metadata = {
  title: "Mi jardín · Secretary Botanic",
}

export default async function JardinPage() {
  // Doble protección: el proxy redirige al login, pero por las dudas
  // chequeamos sesión también acá. Si alguien deshabilita el middleware,
  // la página sigue siendo segura.
  const session = await auth()
  if (!session?.user) {
    redirect("/login")
  }

  const plants = getAllPlants()
  return <GardenView initialPlants={plants} />
}
