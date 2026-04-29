"use client"

import { useCallback, useMemo, useState, useTransition } from "react"
import { toast } from "sonner"
import { registerPlantAction, waterPlantAction } from "@/lib/actions/plants"
import type { Plant, PlantCategory, PlantIdentification } from "@/lib/types"

export function usePlantManager(initialPlants: Plant[]) {
  const [plants, setPlants] = useState<Plant[]>(initialPlants)
  const [isPending, startTransition] = useTransition()

  const waterPlant = useCallback((id: string) => {
    startTransition(async () => {
      const res = await waterPlantAction(id)
      if (res.ok && res.plant) {
        setPlants((prev) => prev.map((p) => (p.id === id ? res.plant! : p)))
        toast.success(`Regaste a ${res.plant.alias}`, {
          description: "Riego registrado en el historial.",
        })
      } else {
        toast.error("No pude registrar el riego")
      }
    })
  }, [])

  const registerPlant = useCallback(
    async (alias: string, identification: PlantIdentification, imageUrl?: string) => {
      const res = await registerPlantAction({ alias, identification, imageUrl })
      if (res.ok) {
        setPlants((prev) => [res.plant, ...prev])
        toast.success(`${res.plant.alias} se sumó a tu jardín`, {
          description: `${res.plant.species} • Riego cada ${res.plant.wateringFrequencyDays} días`,
        })
      }
      return res
    },
    [],
  )

  const groupedByCategory = useMemo(() => {
    const groups: Record<PlantCategory, Plant[]> = {
      interior: [],
      exterior: [],
      suculenta: [],
      comestible: [],
    }
    for (const p of plants) groups[p.category].push(p)
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
