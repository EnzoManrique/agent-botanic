"use client"

import { Flower2 } from "lucide-react"
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { PlantCard } from "./plant-card"
import { CATEGORY_META } from "@/lib/plant-meta"
import type { Plant, PlantCategory } from "@/lib/types"

export function PlantGrid({
  groupedByCategory,
  currentCategory,
  onWater,
  isPending,
}: {
  groupedByCategory: Record<PlantCategory, Plant[]>
  currentCategory: PlantCategory
  onWater: (id: string) => void
  isPending?: boolean
}) {
  const plants = groupedByCategory[currentCategory] ?? []
  const meta = CATEGORY_META[currentCategory]

  return (
    <div className="px-5 pb-2 pt-[75px]">
      {plants.length === 0 ? (
        <Empty className="rounded-3xl border-2 border-dashed border-border bg-card/50 py-12">
          <EmptyHeader>
            <Flower2 className="size-8 mx-auto mb-3 text-muted-foreground" aria-hidden="true" />
            <EmptyTitle className="font-serif">Nada por aquí todavía</EmptyTitle>
            <EmptyDescription>
              Sin plantas en {meta.label.toLowerCase()}. {meta.description} Escaneá una para empezar.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {plants.map((p) => (
            <PlantCard
              key={p.id}
              plant={p}
              onWater={onWater}
              isPending={isPending}
            />
          ))}
        </div>
      )}
    </div>
  )
}
