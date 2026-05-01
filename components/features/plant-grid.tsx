"use client"

import { Flower2 } from "lucide-react"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty"
import { PlantCard } from "./plant-card"
import { CATEGORY_META } from "@/lib/plant-meta"
import type { Plant, PlantCategory } from "@/lib/types"
import type { GardenFilter } from "./garden-view"

export function PlantGrid({
  plants,
  groupedByCategory,
  currentCategory,
  onWater,
  onOpen,
  pendingPlantId,
}: {
  plants: Plant[]
  groupedByCategory: Record<PlantCategory, Plant[]>
  currentCategory: GardenFilter
  onWater: (id: string) => void
  onOpen: (plant: Plant) => void
  /** Id de la planta cuya acción de cuidado se está registrando ahora.
   *  Sólo esa card muestra el spinner; las otras quedan disponibles. */
  pendingPlantId?: string | null
}) {
  // Calculamos si una planta necesita riego para ordenarla primero
  function needsWater(p: Plant) {
    if (!p.lastWateredAt) return true
    const days = Math.floor((Date.now() - p.lastWateredAt) / (1000 * 60 * 60 * 24))
    return days >= p.wateringFrequencyDays
  }

  // Cuando el filtro es "all" mostramos todo el jardín; si no, filtramos.
  // Ordenamos para que las que necesitan riego aparezcan primero.
  const visiblePlants = (
    currentCategory === "all" ? plants : (groupedByCategory[currentCategory] ?? [])
  ).sort((a, b) => {
    const aNeeds = needsWater(a)
    const bNeeds = needsWater(b)
    if (aNeeds && !bNeeds) return -1
    if (!aNeeds && bNeeds) return 1
    return 0 // Mantener el orden original entre los de un mismo grupo
  })

  // Headline contextual del estado vacío.
  const emptyTitle =
    currentCategory === "all"
      ? "Todavía no hay plantas en tu jardín"
      : "Nada por aquí todavía"

  const emptyDescription =
    currentCategory === "all"
      ? "Escaneá tu primera planta desde la pestaña Escanear para empezar."
      : (() => {
          const meta = CATEGORY_META[currentCategory]
          return `Sin plantas en ${meta.label.toLowerCase()}. ${meta.description} Escaneá una para empezar.`
        })()

  // pt compensa la diferencia con el layout principal y el navbar fijo.
  return (
    <div className="px-5 pb-2 pt-10">
      {visiblePlants.length === 0 ? (
        <Empty className="rounded-3xl border-2 border-dashed border-border bg-card/50 py-12">
          <EmptyHeader>
            <Flower2
              className="size-8 mx-auto mb-3 text-muted-foreground"
              aria-hidden="true"
            />
            <EmptyTitle className="font-serif">{emptyTitle}</EmptyTitle>
            <EmptyDescription>{emptyDescription}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        // grid auto-fill: una columna en mobile, dos cuando alcanzan 240px por card.
        <div
          className="grid gap-4"
          style={{
            gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 240px), 1fr))",
          }}
        >
          {visiblePlants.map((p) => (
            <PlantCard
              key={p.id}
              plant={p}
              onWater={onWater}
              onOpen={onOpen}
              isPending={pendingPlantId === p.id}
            />
          ))}
        </div>
      )}
    </div>
  )
}
