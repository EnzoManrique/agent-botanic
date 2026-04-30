"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { getUserSettings, upsertUserSettings } from "@/lib/db/settings"
import {
  DEFAULT_USER_SETTINGS,
  type AdviceFrequency,
  type AgentPersonality,
  type TempUnit,
  type UserSettings,
} from "@/lib/types"

const PERSONALITIES: AgentPersonality[] = ["scientist", "friendly", "guru"]
const FREQUENCIES: AdviceFrequency[] = ["proactive", "manual"]
const UNITS: TempUnit[] = ["celsius", "fahrenheit"]

/**
 * Persiste los settings del usuario en Postgres (`user_settings`).
 * Hace upsert por user_email, así nunca duplica filas.
 */
export async function saveSettings(
  patch: Partial<UserSettings>,
): Promise<{ ok: boolean; settings?: UserSettings; error?: string }> {
  const session = await auth()
  if (!session?.user?.email) {
    return { ok: false, error: "Tenés que iniciar sesión." }
  }

  try {
    const current = await getUserSettings(session.user.email)

    const profile = {
      name: (patch.profile?.name ?? current.profile.name).trim().slice(0, 60),
      email: (patch.profile?.email ?? current.profile.email).trim().slice(0, 120),
    }

    const personality = patch.agent?.personality ?? current.agent.personality
    const adviceFrequency =
      patch.agent?.adviceFrequency ?? current.agent.adviceFrequency
    if (!PERSONALITIES.includes(personality)) {
      return { ok: false, error: "Personalidad del agente inválida." }
    }
    if (!FREQUENCIES.includes(adviceFrequency)) {
      return { ok: false, error: "Frecuencia de consejos inválida." }
    }

    const tempUnit = patch.location?.tempUnit ?? current.location.tempUnit
    if (!UNITS.includes(tempUnit)) {
      return { ok: false, error: "Unidad de temperatura inválida." }
    }

    const next: UserSettings = {
      profile,
      agent: { personality, adviceFrequency },
      location: {
        city:
          (patch.location?.city ?? current.location.city).trim().slice(0, 120) ||
          DEFAULT_USER_SETTINGS.location.city,
        alerts: {
          zonda:
            patch.location?.alerts?.zonda ?? current.location.alerts.zonda,
          frost:
            patch.location?.alerts?.frost ?? current.location.alerts.frost,
          hail: patch.location?.alerts?.hail ?? current.location.alerts.hail,
          heatwave:
            patch.location?.alerts?.heatwave ??
            current.location.alerts.heatwave,
          wateringReminder:
            patch.location?.alerts?.wateringReminder ??
            current.location.alerts.wateringReminder,
        },
        tempUnit,
      },
    }

    const saved = await upsertUserSettings(session.user.email, next)
    revalidatePath("/perfil")
    revalidatePath("/")
    return { ok: true, settings: saved }
  } catch (err) {
    console.error("[v0] Error guardando settings:", err)
    const message = err instanceof Error ? err.message : "Error desconocido"
    return { ok: false, error: message }
  }
}

/**
 * Carga los settings del usuario logueado. Si no existen aún, devuelve
 * defaults con el mail prellenado.
 */
export async function loadSettings(): Promise<UserSettings> {
  const session = await auth()
  if (!session?.user?.email) {
    return structuredClone(DEFAULT_USER_SETTINGS)
  }
  return getUserSettings(session.user.email)
}
