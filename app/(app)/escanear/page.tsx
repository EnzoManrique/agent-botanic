import { ScanView } from "@/components/features/scan-view"
import { getAllPlants } from "@/lib/store"

export const metadata = {
  title: "Escanear · Secretary Botanic",
}

export default async function EscanearPage() {
  const plants = getAllPlants()
  return <ScanView initialPlants={plants} />
}
