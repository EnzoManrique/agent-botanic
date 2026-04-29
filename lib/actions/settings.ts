"use server"

import { revalidatePath } from "next/cache"
import { getSettings, setSettings } from "@/lib/settings-store"
import {
  DEFAULT_USER_SETTINGS,
  type UserSettings,
  type AgentPersonality,
  type AdviceFrequency,
  type TempUnit,
} from "@/lib/types"

const PERSONALITIES: AgentPersonality[] = ["scientist", "friendly", "guru"]
const FREQUENCIES: AdviceFrequency[] = ["proactive", "manual"]
const UNITS: TempUnit[] = ["celsius", "fahrenheit"]

/**
 * Persists the user's settings on the simulated server store.
 * The hackathon prototype uses an in-memory store on globalThis so the
 * round-trip behaves like a real backend. Swap `setSettings` for a DB
 * write when Supabase / Neon is wired up — the public action signature
 * stays the same.
 */
export async function saveSettings(
  patch: Partial<UserSettings>,
  userId: string | null = null,
): Promise<{ ok: boolean; settings?: UserSettings; error?: string }> {
  // Simulate network/DB latency so the spinner is visible in the UI.
  await new Promise((r) => setTimeout(r, 600))

  try {
    const current = getSettings(userId)

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
            patch.location?.alerts?.heatwave ?? current.location.alerts.heatwave,
          wateringReminder:
            patch.location?.alerts?.wateringReminder ??
            current.location.alerts.wateringReminder,
        },
        tempUnit,
      },
    }

    const saved = setSettings(next, userId)
    revalidatePath("/perfil")
    revalidatePath("/")
    return { ok: true, settings: saved }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido"
    return { ok: false, error: message }
  }
}

export async function loadSettings(
  userId: string | null = null,
): Promise<UserSettings> {
  return getSettings(userId)
}
