"use client"

import { useState } from "react"
import { usePlantManager } from "@/lib/hooks/use-plant-manager"
import { CategoryNavbar } from "./category-navbar"
import { PlantGrid } from "./plant-grid"
import { PlantDetailsDialog } from "./plant-details-dialog"
import type { Plant, PlantCategory } from "@/lib/types"

// El filtro acepta una categoría específica o "all" (mostrar todo el jardín).
export type GardenFilter = PlantCategory | "all"

export function GardenView({ initialPlants }: { initialPlants: Plant[] }) {
  const {
    plants,
    groupedByCategory,
    waterPlant,
    editPlant,
    removePlant,
    pendingPlantId,
  } = usePlantManager(initialPlants)

  // Arrancamos en "Todas" así el usuario ve TODO el jardín de una.
  // Si quiere filtrar por categoría, está a un tap.
  const [currentCategory, setCurrentCategory] = useState<GardenFilter>("all")

  const [selectedPlantId, setSelectedPlantId] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  // Releemos la planta del state actualizado: si el usuario edita, la card refleja.
  const selectedPlant = plants.find((p) => p.id === selectedPlantId) ?? null

  function openPlant(plant: Plant) {
    setSelectedPlantId(plant.id)
    setDialogOpen(true)
  }

  const categoryTotals = Object.entries(groupedByCategory).reduce(
    (acc, [cat, plants]) => ({
      ...acc,
      [cat]: plants.length,
    }),
    {} as Record<PlantCategory, number>,
  )

  return (
    <div className="flex flex-col">
      <CategoryNavbar
        groupedByCategory={categoryTotals}
        totalPlants={plants.length}
        defaultTab={currentCategory}
        onTabChange={setCurrentCategory}
      />
      <PlantGrid
        plants={plants}
        groupedByCategory={groupedByCategory}
        currentCategory={currentCategory}
        onWater={waterPlant}
        onOpen={openPlant}
        pendingPlantId={pendingPlantId}
      />
      <PlantDetailsDialog
        plant={selectedPlant}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onEdit={editPlant}
        onDelete={removePlant}
      />
    </div>
  )
}
