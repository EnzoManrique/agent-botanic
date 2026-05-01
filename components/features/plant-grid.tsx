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
  // Cuando el filtro es "all" mostramos todo el jardín; si no, filtramos.
  const visiblePlants =
    currentCategory === "all" ? plants : (groupedByCategory[currentCategory] ?? [])

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

  // pt compensa el navbar fijo de arriba: header de una sola fila
  // (icono + título + contador) + chips. Si el navbar crece, ajustar acá.
  return (
    <div className="px-5 pb-2 pt-[124px]">
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
