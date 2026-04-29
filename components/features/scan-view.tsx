"use client"

import { Camera } from "lucide-react"
import { usePlantManager } from "@/lib/hooks/use-plant-manager"
import { ScannerPanel } from "./scanner-panel"
import { ScreenHeader } from "@/components/mobile/screen-header"
import type { Plant } from "@/lib/types"

export function ScanView({ initialPlants }: { initialPlants: Plant[] }) {
  const { registerPlant } = usePlantManager(initialPlants)

  return (
    <div className="flex flex-col mt-[25px]">
      <ScreenHeader
        icon={<Camera className="size-5" aria-hidden="true" />}
        eyebrow="Cámara · Identificación con IA"
        title="Escanear planta"
        subtitle="Sacá una foto y el agente identifica la especie."
      />
      <ScannerPanel onRegister={registerPlant} />
    </div>
  )
}
