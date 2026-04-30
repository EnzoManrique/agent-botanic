"use client"

import { useCallback, useMemo, useState, useTransition } from "react"
import { toast } from "sonner"
import { registerPlantAction, waterPlantAction } from "@/lib/actions/plants"
import { ALL_CATEGORIES, WATERING_MODE_META } from "@/lib/plant-meta"
import type { Plant, PlantCategory, PlantIdentification } from "@/lib/types"

export function usePlantManager(initialPlants: Plant[]) {
  const [plants, setPlants] = useState<Plant[]>(initialPlants)
  const [isPending, startTransition] = useTransition()

  const waterPlant = useCallback((id: string) => {
    startTransition(async () => {
      const res = await waterPlantAction(id)
      if (res.ok && res.plant) {
        setPlants((prev) => prev.map((p) => (p.id === id ? res.plant! : p)))
        const mode = WATERING_MODE_META[res.plant.wateringMode]
        toast.success(`${mode.actionPast} ${res.plant.alias}`, {
          description: "Acción de cuidado registrada en el historial.",
        })
      } else {
        toast.error("No pude registrar la acción de cuidado")
      }
    })
  }, [])

  const registerPlant = useCallback(
    async (alias: string, identification: PlantIdentification, imageUrl?: string) => {
      const res = await registerPlantAction({ alias, identification, imageUrl })
      if (res.ok) {
        setPlants((prev) => [res.plant, ...prev])
        const mode = WATERING_MODE_META[res.plant.wateringMode]
        toast.success(`${res.plant.alias} se sumó a tu jardín`, {
          description: `${res.plant.species} • ${mode.actionVerb} cada ${res.plant.wateringFrequencyDays} días`,
        })
      }
      return res
    },
    [],
  )

  const groupedByCategory = useMemo(() => {
    const groups = ALL_CATEGORIES.reduce(
      (acc, cat) => {
        acc[cat] = []
        return acc
      },
      {} as Record<PlantCategory, Plant[]>,
    )
    for (const p of plants) {
      // Si llegara un valor inválido, lo agrupamos en interior como fallback.
      const cat = (groups[p.category] ? p.category : "interior") as PlantCategory
      groups[cat].push(p)
    }
    return groups
  }, [plants])

  const needsWatering = useMemo(() => {
    return plants.filter((p) => {
      if (!p.lastWateredAt) return true
      const days = (Date.now() - p.lastWateredAt) / (1000 * 60 * 60 * 24)
      return days >= p.wateringFrequencyDays
    })
  }, [plants])

  return {
    plants,
    groupedByCategory,
    needsWatering,
    waterPlant,
    registerPlant,
    isPending,
  }
}
