"use client"

import { Camera } from "lucide-react"
import { usePlantManager } from "@/lib/hooks/use-plant-manager"
import { ScannerPanel } from "./scanner-panel"
import { ScreenHeader } from "@/components/mobile/screen-header"
import type { Plant } from "@/lib/types"
import { useLanguage } from "@/lib/i18n/context"

export function ScanView({ initialPlants }: { initialPlants: Plant[] }) {
  const { registerPlant } = usePlantManager(initialPlants)
  const { language } = useLanguage()

  return (
    <div className="flex flex-col mt-[25px]">
      <ScreenHeader
        icon={<Camera className="size-5" aria-hidden="true" />}
        eyebrow={language === "en" ? "Camera · AI Identification" : "Cámara · Identificación con IA"}
        title={language === "en" ? "Scan plant" : "Escanear planta"}
        subtitle={language === "en" ? "Take a photo and the agent will identify the species." : "Sacá una foto y el agente identifica la especie."}
      />
      <ScannerPanel onRegister={registerPlant} />
    </div>
  )
}
