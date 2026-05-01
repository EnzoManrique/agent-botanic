import "server-only"
import { sql } from "@/lib/db"
import type { CareLog } from "@/lib/types"

/** Inserta una entrada en el historial de cuidados de una planta. */
export async function addCareLog(
  userEmail: string,
  plantId: string,
  type: CareLog["type"],
  note?: string,
): Promise<void> {
  const numericId = Number(plantId)
  if (!Number.isInteger(numericId)) return
  await sql`
    INSERT INTO care_logs (plant_id, user_email, type, note)
    VALUES (${numericId}, ${userEmail}, ${type}, ${note ?? null})
  `
}

type CareLogRow = {
  id: number
  plant_id: number
  type: string
  note: string | null
  created_at: Date | string
}

const VALID_TYPES: CareLog["type"][] = ["water", "fertilize", "prune", "repot"]

export async function getLogsForPlant(
  userEmail: string,
  plantId: string,
): Promise<CareLog[]> {
  const numericId = Number(plantId)
  if (!Number.isInteger(numericId)) return []
  const rows = (await sql`
    SELECT id, plant_id, type, note, created_at
    FROM care_logs
    WHERE plant_id = ${numericId} AND user_email = ${userEmail}
    ORDER BY created_at DESC
    LIMIT 50
  `) as CareLogRow[]
  return rows.map((r) => ({
    id: String(r.id),
    plantId: String(r.plant_id),
    type: VALID_TYPES.includes(r.type as CareLog["type"])
      ? (r.type as CareLog["type"])
      : "water",
    timestamp: new Date(r.created_at).getTime(),
    note: r.note ?? undefined,
  }))
}
