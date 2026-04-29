import { GardenView } from "@/components/features/garden-view"
import { getAllPlants } from "@/lib/store"

export const metadata = {
  title: "Mi jardín · Secretary Botanic",
}

export default async function JardinPage() {
  const plants = getAllPlants()
  return <GardenView initialPlants={plants} />
}
