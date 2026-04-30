"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { addLog, addPlant, getAllPlants, getPlantById, updatePlant } from "@/lib/store"
import type { Plant, PlantCategory, PlantIdentification } from "@/lib/types"
import { auth } from "@/auth"
import { sql } from "@/lib/db"

/**
 * Esquema de validación para la nueva planta.
 * Se valida tanto del lado del cliente como del servidor (esto vale acá).
 */
const SavePlantSchema = z.object({
  nickname: z.string().trim().min(1, "Ponele un apodo a tu planta."),
  species: z.string().trim().min(1, "Necesitamos saber la especie."),
  watering_frequency_days: z
    .number()
    .int()
    .min(1, "Mínimo 1 día.")
    .max(60, "Máximo 60 días."),
  category: z.string().trim().min(1, "Elegí una categoría."),
})

export type SavePlantInput = z.infer<typeof SavePlantSchema>

export type SavePlantResult =
  | { ok: true; id: number }
  | { ok: false; error: string }

/**
 * Inserta una nueva planta en la tabla `plants` de Postgres asociada al
 * usuario logueado.
 *
 * Columnas: id (SERIAL), user_email, nickname, species,
 * watering_frequency_days, category.
 */
export async function savePlant(input: SavePlantInput): Promise<SavePlantResult> {
  // 1. Verificamos que haya sesión activa
  const session = await auth()
  if (!session?.user?.email) {
    return { ok: false, error: "Tenés que iniciar sesión para guardar plantas." }
  }

  // 2. Validamos los inputs
  const parsed = SavePlantSchema.safeParse(input)
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Datos inválidos.",
    }
  }

  // 3. Insertamos en Postgres usando query parametrizada (anti SQL injection)
  try {
    const rows = (await sql`
      INSERT INTO plants (
        user_email,
        nickname,
        species,
        watering_frequency_days,
        category
      ) VALUES (
        ${session.user.email},
        ${parsed.data.nickname},
        ${parsed.data.species},
        ${parsed.data.watering_frequency_days},
        ${parsed.data.category}
      )
      RETURNING id
    `) as { id: number }[]
    revalidatePath("/jardin")
    revalidatePath("/")
    return { ok: true, id: rows[0]?.id ?? 0 }
  } catch (error) {
    console.error("[v0] Error guardando planta:", error)
    return { ok: false, error: "No pudimos guardar la planta en el jardín." }
  }
}

/** Fields the user is allowed to overwrite manually after the AI suggestion. */
export interface PlantDetailsPatch {
  alias?: string
  species?: string
  scientificName?: string
  category?: PlantCategory
  wateringFrequencyDays?: number
  lightNeeds?: "alta" | "media" | "baja"
  notes?: string
}

/**
 * Persists manual edits the user makes to a plant the AI previously identified.
 * Used both from the scanner flow (after editing the AI suggestion) and from
 * the garden detail view to correct mislabeled plants.
 */
export async function updatePlantDetails(
  plantId: string,
  patch: PlantDetailsPatch,
): Promise<{ ok: boolean; plant?: Plant; error?: string }> {
  const existing = getPlantById(plantId)
  if (!existing) {
    return { ok: false, error: "No encontré esa planta en tu jardín." }
  }

  // Validate numeric range so the user can't set absurd watering frequencies.
  const cleanWatering =
    typeof patch.wateringFrequencyDays === "number"
      ? Math.max(1, Math.min(60, Math.round(patch.wateringFrequencyDays)))
      : undefined

  const cleanPatch: Partial<Plant> = {
    ...(patch.alias !== undefined && { alias: patch.alias.trim() || existing.alias }),
    ...(patch.species !== undefined && { species: patch.species.trim() || existing.species }),
    ...(patch.scientificName !== undefined && {
      scientificName: patch.scientificName.trim() || existing.scientificName,
    }),
    ...(patch.category !== undefined && { category: patch.category }),
    ...(cleanWatering !== undefined && { wateringFrequencyDays: cleanWatering }),
    ...(patch.lightNeeds !== undefined && { lightNeeds: patch.lightNeeds }),
    ...(patch.notes !== undefined && { notes: patch.notes }),
  }

  const updated = updatePlant(plantId, cleanPatch)
  if (!updated) return { ok: false, error: "No pude guardar los cambios." }

  revalidatePath("/")
  revalidatePath("/jardin")
  return { ok: true, plant: updated }
}

export async function listPlantsAction(): Promise<Plant[]> {
  return getAllPlants()
}

export async function waterPlantAction(plantId: string): Promise<{
  ok: boolean
  plant?: Plant
}> {
  const now = Date.now()
  const plant = updatePlant(plantId, { lastWateredAt: now })
  if (!plant) return { ok: false }
  addLog({
    id: `log_${now}_${Math.random().toString(36).slice(2, 8)}`,
    plantId,
    type: "water",
    timestamp: now,
    note: "Riego registrado",
  })
  revalidatePath("/")
  revalidatePath("/jardin")
  return { ok: true, plant }
}

export async function registerPlantAction(input: {
  alias: string
  identification: PlantIdentification
  imageUrl?: string
}): Promise<{ ok: true; plant: Plant }> {
  const id = `p_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`
  const plant: Plant = {
    id,
    alias: input.alias.trim() || input.identification.species,
    species: input.identification.species,
    scientificName: input.identification.scientificName,
    category: input.identification.category,
    imageUrl: input.imageUrl || "/plants/monstera.jpg",
    wateringFrequencyDays: input.identification.wateringFrequencyDays,
    lightNeeds: input.identification.lightNeeds,
    createdAt: Date.now(),
    lastWateredAt: null,
    notes: input.identification.description,
  }
  addPlant(plant)
  revalidatePath("/")
  revalidatePath("/jardin")
  return { ok: true, plant }
}

/**
 * Simulated multimodal identification.
 * In production this would call a vision model (e.g. gemini-3.1-flash-image).
 * For the hackathon prototype we return a plausible identification
 * sampled from a small catalog so the demo flow is reliable offline.
 */
export async function identifyPlantAction(_imageDataUrl: string): Promise<PlantIdentification> {
  await new Promise((r) => setTimeout(r, 1200))

  const catalog: PlantIdentification[] = [
    {
      species: "Costilla de Adán",
      scientificName: "Monstera deliciosa",
      category: "interior" as PlantCategory,
      wateringFrequencyDays: 7,
      lightNeeds: "media",
      confidence: 0.94,
      description: "Tropical de hojas perforadas. Prefiere luz indirecta y sustrato bien drenado.",
    },
    {
      species: "Potus",
      scientificName: "Epipremnum aureum",
      category: "interior" as PlantCategory,
      wateringFrequencyDays: 5,
      lightNeeds: "baja",
      confidence: 0.91,
      description: "Trepadora muy resistente. Tolera poca luz y olvidos de riego.",
    },
    {
      species: "Aloe vera",
      scientificName: "Aloe barbadensis miller",
      category: "suculenta" as PlantCategory,
      wateringFrequencyDays: 14,
      lightNeeds: "alta",
      confidence: 0.96,
      description: "Suculenta medicinal. Riego escaso, sol directo y suelo arenoso.",
    },
    {
      species: "Albahaca",
      scientificName: "Ocimum basilicum",
      category: "comestible" as PlantCategory,
      wateringFrequencyDays: 2,
      lightNeeds: "alta",
      confidence: 0.88,
      description: "Aromática anual. Necesita sol pleno y riego frecuente sin encharcar.",
    },
  ]

  return catalog[Math.floor(Math.random() * catalog.length)]
}
