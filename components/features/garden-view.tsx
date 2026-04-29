"use client"

import { useState } from "react"
import { usePlantManager } from "@/lib/hooks/use-plant-manager"
import { CategoryNavbar } from "./category-navbar"
import { PlantGrid } from "./plant-grid"
import type { Plant, PlantCategory } from "@/lib/types"

export function GardenView({ initialPlants }: { initialPlants: Plant[] }) {
  const { groupedByCategory, waterPlant, isPending } =
    usePlantManager(initialPlants)

  const [currentCategory, setCurrentCategory] = useState<PlantCategory>(() => {
    const categories = Object.keys(groupedByCategory) as PlantCategory[]
    return categories.find((c) => groupedByCategory[c].length > 0) ?? "interior"
  })

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
        isPending={isPending}
      />
    </div>
  )
}
