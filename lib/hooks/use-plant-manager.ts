"use client"

import { useCallback, useMemo, useState, useTransition } from "react"
import { toast } from "sonner"
import {
  deletePlantAction,
  registerPlantAction,
  updatePlantDetails as updatePlantDetailsAction,
  waterPlantAction,
  type PlantDetailsPatch,
} from "@/lib/actions/plants"
import { ALL_CATEGORIES, WATERING_MODE_META } from "@/lib/plant-meta"
import type {
  Plant,
  PlantCategory,
  PlantIdentification,
  PlantLocation,
} from "@/lib/types"

export function usePlantManager(initialPlants: Plant[]) {
  const [plants, setPlants] = useState<Plant[]>(initialPlants)
  const [isPending, startTransition] = useTransition()
  // Trackeamos QUÉ planta está siendo regada en este momento. Sin esto el
  // `isPending` del transition es global y todas las cards muestran spinner
  // a la vez aunque solo se haya tocado una. Lo seteamos al iniciar la
  // acción y lo limpiamos cuando el server respondió.
  const [pendingPlantId, setPendingPlantId] = useState<string | null>(null)

  const waterPlant = useCallback((id: string) => {
    setPendingPlantId(id)
    startTransition(async () => {
      try {
        const res = await waterPlantAction(id)
        if (res.ok && res.plant) {
          setPlants((prev) =>
            prev.map((p) => (p.id === id ? res.plant! : p)),
          )
          const mode = WATERING_MODE_META[res.plant.wateringMode]
          toast.success(`${mode.actionPast} ${res.plant.alias}`, {
            description: "Acción de cuidado registrada en el historial.",
          })
        } else {
          toast.error("No pude registrar la acción de cuidado")
        }
      } finally {
        setPendingPlantId(null)
      }
    })
  }, [])

  const registerPlant = useCallback(
    async (
      alias: string,
      identification: PlantIdentification,
      imageUrl?: string,
      location?: PlantLocation,
    ) => {
      const res = await registerPlantAction({
        alias,
        identification,
        imageUrl,
        location,
      })
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

  /** Edita una planta existente y refleja el resultado en el state local. */
  const editPlant = useCallback(
    async (
      id: string,
      patch: PlantDetailsPatch,
    ): Promise<{ ok: boolean; error?: string }> => {
      const res = await updatePlantDetailsAction(id, patch)
      if (res.ok && res.plant) {
        setPlants((prev) => prev.map((p) => (p.id === id ? res.plant! : p)))
        toast.success("Cambios guardados", {
          description: `${res.plant.alias} se actualizó correctamente.`,
        })
        return { ok: true }
      }
      toast.error(res.error ?? "No pude guardar los cambios")
      return { ok: false, error: res.error }
    },
    [],
  )

  /** Borra una planta. Optimista: la sacamos del state apenas confirma el server. */
  const removePlant = useCallback(
    async (id: string): Promise<{ ok: boolean; error?: string }> => {
      const target = plants.find((p) => p.id === id)
      const res = await deletePlantAction(id)
      if (res.ok) {
        setPlants((prev) => prev.filter((p) => p.id !== id))
        toast.success(
          target ? `Eliminaste a ${target.alias}` : "Planta eliminada",
          { description: "Se borró del jardín y de tu historial." },
        )
        return { ok: true }
      }
      toast.error(res.error ?? "No pude borrar la planta")
      return { ok: false, error: res.error }
    },
    [plants],
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
    editPlant,
    removePlant,
    isPending,
    pendingPlantId,
  }
}
