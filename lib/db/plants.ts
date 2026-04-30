import "server-only"
import { sql } from "@/lib/db"
import type { Plant, PlantCategory } from "@/lib/types"

/**
 * Capa de datos para la tabla `plants`.
 * Toda función recibe `userEmail` para garantizar que cada usuario solo vea
 * y modifique sus propias plantas (multi-tenant).
 */

type PlantRow = {
  id: number
  user_email: string
  nickname: string
  species: string
  scientific_name: string | null
  watering_frequency_days: number
  category: string
  light_needs: string | null
  notes: string | null
  image_url: string | null
  created_at: Date | string
  last_watered_at: Date | string | null
}

const VALID_CATEGORIES: PlantCategory[] = [
  "interior",
  "exterior",
  "suculenta",
  "comestible",
]

const VALID_LIGHT: Plant["lightNeeds"][] = ["alta", "media", "baja"]

function toMillis(value: Date | string | null): number | null {
  if (value === null) return null
  return new Date(value).getTime()
}

/** Convierte un row de Postgres al tipo Plant que usa el front. */
function rowToPlant(row: PlantRow): Plant {
  const category = VALID_CATEGORIES.includes(row.category as PlantCategory)
    ? (row.category as PlantCategory)
    : "interior"
  const lightNeeds = VALID_LIGHT.includes(row.light_needs as Plant["lightNeeds"])
    ? (row.light_needs as Plant["lightNeeds"])
    : "media"
  return {
    id: String(row.id),
    alias: row.nickname,
    species: row.species,
    scientificName: row.scientific_name ?? "",
    category,
    imageUrl: row.image_url ?? "/plants/monstera.jpg",
    wateringFrequencyDays: row.watering_frequency_days,
    lightNeeds,
    createdAt: toMillis(row.created_at) ?? Date.now(),
    lastWateredAt: toMillis(row.last_watered_at),
    notes: row.notes ?? undefined,
  }
}

/** Lista todas las plantas del usuario logueado, ordenadas por creación. */
export async function getAllPlants(userEmail: string): Promise<Plant[]> {
  const rows = (await sql`
    SELECT id, user_email, nickname, species, scientific_name,
           watering_frequency_days, category, light_needs, notes,
           image_url, created_at, last_watered_at
    FROM plants
    WHERE user_email = ${userEmail}
    ORDER BY created_at DESC
  `) as PlantRow[]
  return rows.map(rowToPlant)
}

/** Obtiene una planta por id, validando que pertenezca al usuario. */
export async function getPlantById(
  userEmail: string,
  plantId: string,
): Promise<Plant | undefined> {
  const numericId = Number(plantId)
  if (!Number.isInteger(numericId)) return undefined
  const rows = (await sql`
    SELECT id, user_email, nickname, species, scientific_name,
           watering_frequency_days, category, light_needs, notes,
           image_url, created_at, last_watered_at
    FROM plants
    WHERE id = ${numericId} AND user_email = ${userEmail}
    LIMIT 1
  `) as PlantRow[]
  return rows[0] ? rowToPlant(rows[0]) : undefined
}

export interface CreatePlantInput {
  alias: string
  species: string
  scientificName: string
  category: PlantCategory
  wateringFrequencyDays: number
  lightNeeds: Plant["lightNeeds"]
  imageUrl?: string
  notes?: string
}

export async function createPlant(
  userEmail: string,
  input: CreatePlantInput,
): Promise<Plant> {
  const rows = (await sql`
    INSERT INTO plants (
      user_email, nickname, species, scientific_name,
      watering_frequency_days, category, light_needs, notes, image_url
    ) VALUES (
      ${userEmail},
      ${input.alias},
      ${input.species},
      ${input.scientificName},
      ${input.wateringFrequencyDays},
      ${input.category},
      ${input.lightNeeds},
      ${input.notes ?? null},
      ${input.imageUrl ?? null}
    )
    RETURNING id, user_email, nickname, species, scientific_name,
              watering_frequency_days, category, light_needs, notes,
              image_url, created_at, last_watered_at
  `) as PlantRow[]
  return rowToPlant(rows[0])
}

export interface UpdatePlantPatch {
  alias?: string
  species?: string
  scientificName?: string
  category?: PlantCategory
  wateringFrequencyDays?: number
  lightNeeds?: Plant["lightNeeds"]
  notes?: string
  imageUrl?: string
}

/**
 * Actualiza campos editables de una planta. Usa COALESCE para que los
 * valores no provistos no pisen lo existente.
 */
export async function updatePlantDetails(
  userEmail: string,
  plantId: string,
  patch: UpdatePlantPatch,
): Promise<Plant | undefined> {
  const numericId = Number(plantId)
  if (!Number.isInteger(numericId)) return undefined

  const rows = (await sql`
    UPDATE plants
    SET nickname = COALESCE(${patch.alias ?? null}, nickname),
        species = COALESCE(${patch.species ?? null}, species),
        scientific_name = COALESCE(${patch.scientificName ?? null}, scientific_name),
        category = COALESCE(${patch.category ?? null}, category),
        watering_frequency_days = COALESCE(${patch.wateringFrequencyDays ?? null}, watering_frequency_days),
        light_needs = COALESCE(${patch.lightNeeds ?? null}, light_needs),
        notes = COALESCE(${patch.notes ?? null}, notes),
        image_url = COALESCE(${patch.imageUrl ?? null}, image_url)
    WHERE id = ${numericId} AND user_email = ${userEmail}
    RETURNING id, user_email, nickname, species, scientific_name,
              watering_frequency_days, category, light_needs, notes,
              image_url, created_at, last_watered_at
  `) as PlantRow[]
  return rows[0] ? rowToPlant(rows[0]) : undefined
}

/** Marca un riego: setea last_watered_at = NOW() y devuelve la planta. */
export async function markWatered(
  userEmail: string,
  plantId: string,
): Promise<Plant | undefined> {
  const numericId = Number(plantId)
  if (!Number.isInteger(numericId)) return undefined
  const rows = (await sql`
    UPDATE plants
    SET last_watered_at = CURRENT_TIMESTAMP
    WHERE id = ${numericId} AND user_email = ${userEmail}
    RETURNING id, user_email, nickname, species, scientific_name,
              watering_frequency_days, category, light_needs, notes,
              image_url, created_at, last_watered_at
  `) as PlantRow[]
  return rows[0] ? rowToPlant(rows[0]) : undefined
}
