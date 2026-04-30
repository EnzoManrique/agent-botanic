"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { auth } from "@/auth"
import {
  createPlant,
  getAllPlants as dbGetAllPlants,
  getPlantById as dbGetPlantById,
  markWatered,
  updatePlantDetails as dbUpdatePlantDetails,
} from "@/lib/db/plants"
import { addCareLog } from "@/lib/db/care-logs"
import { sql } from "@/lib/db"
import type {
  Plant,
  PlantCategory,
  PlantIdentification,
  WateringMode,
} from "@/lib/types"

/* -------------------------------------------------------------------------- */
/* savePlant — insert simple usado desde el front si quieren registrar manual  */
/* -------------------------------------------------------------------------- */

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

export async function savePlant(input: SavePlantInput): Promise<SavePlantResult> {
  const session = await auth()
  if (!session?.user?.email) {
    return { ok: false, error: "Tenés que iniciar sesión para guardar plantas." }
  }
  const parsed = SavePlantSchema.safeParse(input)
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Datos inválidos.",
    }
  }
  try {
    const rows = (await sql`
      INSERT INTO plants (user_email, nickname, species, watering_frequency_days, category)
      VALUES (
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

/* -------------------------------------------------------------------------- */
/* updatePlantDetails — usuario corrige info que la IA identificó             */
/* -------------------------------------------------------------------------- */

export interface PlantDetailsPatch {
  alias?: string
  species?: string
  scientificName?: string
  category?: PlantCategory
  wateringFrequencyDays?: number
  wateringMode?: WateringMode
  lightNeeds?: "alta" | "media" | "baja"
  notes?: string
}

export async function updatePlantDetails(
  plantId: string,
  patch: PlantDetailsPatch,
): Promise<{ ok: boolean; plant?: Plant; error?: string }> {
  const session = await auth()
  if (!session?.user?.email) {
    return { ok: false, error: "Tenés que iniciar sesión." }
  }

  // Validamos rango numérico (max/min) antes de tocar la DB.
  const cleanWatering =
    typeof patch.wateringFrequencyDays === "number"
      ? Math.max(1, Math.min(60, Math.round(patch.wateringFrequencyDays)))
      : undefined

  const updated = await dbUpdatePlantDetails(session.user.email, plantId, {
    alias: patch.alias?.trim() || undefined,
    species: patch.species?.trim() || undefined,
    scientificName: patch.scientificName?.trim() || undefined,
    category: patch.category,
    wateringFrequencyDays: cleanWatering,
    wateringMode: patch.wateringMode,
    lightNeeds: patch.lightNeeds,
    notes: patch.notes,
  })
  if (!updated) {
    return { ok: false, error: "No encontré esa planta en tu jardín." }
  }

  revalidatePath("/")
  revalidatePath("/jardin")
  return { ok: true, plant: updated }
}

/* -------------------------------------------------------------------------- */
/* listPlantsAction — usado por el front para refrescar la lista              */
/* -------------------------------------------------------------------------- */

export async function listPlantsAction(): Promise<Plant[]> {
  const session = await auth()
  if (!session?.user?.email) return []
  return dbGetAllPlants(session.user.email)
}

/* -------------------------------------------------------------------------- */
/* waterPlantAction — marca riego en plants + agrega care_log                 */
/* -------------------------------------------------------------------------- */

export async function waterPlantAction(plantId: string): Promise<{
  ok: boolean
  plant?: Plant
}> {
  const session = await auth()
  if (!session?.user?.email) return { ok: false }

  const plant = await markWatered(session.user.email, plantId)
  if (!plant) return { ok: false }

  // Best-effort: si falla el log no rompemos el riego.
  try {
    await addCareLog(session.user.email, plantId, "water", "Riego registrado")
  } catch (error) {
    console.error("[v0] Error guardando care_log:", error)
  }

  revalidatePath("/")
  revalidatePath("/jardin")
  return { ok: true, plant }
}

/* -------------------------------------------------------------------------- */
/* registerPlantAction — sumar al jardín una planta identificada por la IA    */
/* -------------------------------------------------------------------------- */

export async function registerPlantAction(input: {
  alias: string
  identification: PlantIdentification
  imageUrl?: string
}): Promise<{ ok: true; plant: Plant } | { ok: false; error: string }> {
  const session = await auth()
  if (!session?.user?.email) {
    return { ok: false, error: "Tenés que iniciar sesión." }
  }

  try {
    const plant = await createPlant(session.user.email, {
      alias: input.alias.trim() || input.identification.species,
      species: input.identification.species,
      scientificName: input.identification.scientificName,
      category: input.identification.category,
      wateringFrequencyDays: input.identification.wateringFrequencyDays,
      wateringMode: input.identification.wateringMode,
      lightNeeds: input.identification.lightNeeds,
      imageUrl: input.imageUrl,
      notes: input.identification.description,
    })
    revalidatePath("/")
    revalidatePath("/jardin")
    return { ok: true, plant }
  } catch (error) {
    console.error("[v0] Error registrando planta:", error)
    return { ok: false, error: "No pudimos registrar la planta." }
  }
}

/* -------------------------------------------------------------------------- */
/* getPlantAction — opcional, por si alguna vista lo necesita en el futuro    */
/* -------------------------------------------------------------------------- */

export async function getPlantAction(plantId: string): Promise<Plant | null> {
  const session = await auth()
  if (!session?.user?.email) return null
  const plant = await dbGetPlantById(session.user.email, plantId)
  return plant ?? null
}

/* -------------------------------------------------------------------------- */
/* identifyPlantAction — sin cambios, la IA simulada vive 100% in-process     */
/* -------------------------------------------------------------------------- */

export async function identifyPlantAction(
  _imageDataUrl: string,
): Promise<PlantIdentification> {
  await new Promise((r) => setTimeout(r, 1200))

  const catalog: PlantIdentification[] = [
    {
      species: "Costilla de Adán",
      scientificName: "Monstera deliciosa",
      category: "tropical",
      wateringFrequencyDays: 7,
      wateringMode: "soil",
      lightNeeds: "media",
      confidence: 0.94,
      description:
        "Tropical de hojas perforadas. Prefiere luz indirecta y sustrato bien drenado.",
    },
    {
      species: "Potus",
      scientificName: "Epipremnum aureum",
      category: "trepadora",
      wateringFrequencyDays: 14,
      wateringMode: "water",
      lightNeeds: "baja",
      confidence: 0.91,
      description:
        "Trepadora muy resistente. Crece bien en frasco con agua: cambiala cada 2 semanas.",
    },
    {
      species: "Aloe vera",
      scientificName: "Aloe barbadensis miller",
      category: "suculenta",
      wateringFrequencyDays: 14,
      wateringMode: "soil",
      lightNeeds: "alta",
      confidence: 0.96,
      description:
        "Suculenta medicinal. Riego escaso, sol directo y suelo arenoso.",
    },
    {
      species: "Albahaca",
      scientificName: "Ocimum basilicum",
      category: "comestible",
      wateringFrequencyDays: 2,
      wateringMode: "soil",
      lightNeeds: "alta",
      confidence: 0.88,
      description:
        "Aromática anual. Necesita sol pleno y riego frecuente sin encharcar.",
    },
    {
      species: "Orquídea Phalaenopsis",
      scientificName: "Phalaenopsis amabilis",
      category: "epifita",
      wateringFrequencyDays: 3,
      wateringMode: "mist",
      lightNeeds: "media",
      confidence: 0.89,
      description:
        "Epífita de raíces aéreas. Pulverizar cada 2-3 días y sumergir el sustrato semanalmente.",
    },
    {
      species: "Lechuga hidropónica",
      scientificName: "Lactuca sativa",
      category: "hidroponia",
      wateringFrequencyDays: 14,
      wateringMode: "hydroponic",
      lightNeeds: "alta",
      confidence: 0.92,
      description:
        "Cultivo en NFT o DWC. Renová la solución nutritiva cada 2 semanas y mantené pH 5.5-6.5.",
    },
    {
      species: "Lucky bamboo",
      scientificName: "Dracaena sanderiana",
      category: "acuatica",
      wateringFrequencyDays: 10,
      wateringMode: "water",
      lightNeeds: "baja",
      confidence: 0.90,
      description:
        "Vive en agua con piedras. Cambiá el agua cada 7-10 días y usá agua sin cloro.",
    },
    {
      species: "Lavanda",
      scientificName: "Lavandula angustifolia",
      category: "exterior",
      wateringFrequencyDays: 10,
      wateringMode: "soil",
      lightNeeds: "alta",
      confidence: 0.87,
      description:
        "Mediterránea aromática. Suelo seco y bien drenado, sol pleno.",
    },
    {
      species: "Rosa",
      scientificName: "Rosa chinensis",
      category: "floracion",
      wateringFrequencyDays: 4,
      wateringMode: "soil",
      lightNeeds: "alta",
      confidence: 0.93,
      description:
        "Arbusto floral clásico. Riego al pie evitando mojar las hojas, podas en invierno.",
    },
    {
      species: "Ficus benjamina",
      scientificName: "Ficus benjamina",
      category: "arbol",
      wateringFrequencyDays: 7,
      wateringMode: "soil",
      lightNeeds: "media",
      confidence: 0.85,
      description:
        "Árbol de interior muy popular. No le gustan los cambios de lugar bruscos.",
    },
    {
      species: "Ficus retusa (bonsai)",
      scientificName: "Ficus retusa",
      category: "bonsai",
      wateringFrequencyDays: 3,
      wateringMode: "soil",
      lightNeeds: "media",
      confidence: 0.86,
      description:
        "Bonsai resistente para principiantes. Riego cuando la superficie del sustrato se seca.",
    },
    {
      species: "Tillandsia",
      scientificName: "Tillandsia ionantha",
      category: "epifita",
      wateringFrequencyDays: 2,
      wateringMode: "mist",
      lightNeeds: "media",
      confidence: 0.88,
      description:
        "Aérea sin sustrato. Pulverizá cada 2 días y sumergila 20 minutos por semana.",
    },
  ]

  return catalog[Math.floor(Math.random() * catalog.length)]
}
