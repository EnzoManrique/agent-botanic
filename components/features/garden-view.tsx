"use client"

import { useState } from "react"
import { usePlantManager } from "@/lib/hooks/use-plant-manager"
import { CategoryNavbar } from "./category-navbar"
import { PlantGrid } from "./plant-grid"
import { PlantDetailsDialog } from "./plant-details-dialog"
import type { Plant, PlantCategory } from "@/lib/types"

export function GardenView({ initialPlants }: { initialPlants: Plant[] }) {
  const {
    plants,
    groupedByCategory,
    waterPlant,
    editPlant,
    removePlant,
    isPending,
  } = usePlantManager(initialPlants)

  const [currentCategory, setCurrentCategory] = useState<PlantCategory>(() => {
    const categories = Object.keys(groupedByCategory) as PlantCategory[]
    return categories.find((c) => groupedByCategory[c].length > 0) ?? "interior"
  })

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
        defaultTab={currentCategory}
        onTabChange={setCurrentCategory}
      />
      <PlantGrid
        groupedByCategory={groupedByCategory}
        currentCategory={currentCategory}
        onWater={waterPlant}
        onOpen={openPlant}
        isPending={isPending}
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
