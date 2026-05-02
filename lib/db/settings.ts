import "server-only"
import { sql } from "@/lib/db"
import {
  DEFAULT_USER_SETTINGS,
  type AdviceFrequency,
  type AgentPersonality,
  type TempUnit,
  type UserSettings,
} from "@/lib/types"

/**
 * Capa de datos para la tabla `user_settings`.
 * Un row por user_email. Si el usuario no tiene fila, devolvemos defaults.
 */

type SettingsRow = {
  user_email: string
  profile_name: string
  profile_email: string
  agent_personality: string
  advice_frequency: string
  city: string
  alert_zonda: boolean
  alert_frost: boolean
  alert_hail: boolean
  alert_heatwave: boolean
  alert_watering_reminder: boolean
  temp_unit: string
  latitude?: number | null
  longitude?: number | null
}

const PERSONALITIES: AgentPersonality[] = ["scientist", "friendly", "guru"]
const FREQUENCIES: AdviceFrequency[] = ["proactive", "manual"]
const UNITS: TempUnit[] = ["celsius", "fahrenheit"]

function rowToSettings(row: SettingsRow): UserSettings {
  return {
    profile: {
      name: row.profile_name,
      email: row.profile_email,
    },
    agent: {
      personality: PERSONALITIES.includes(
        row.agent_personality as AgentPersonality,
      )
        ? (row.agent_personality as AgentPersonality)
        : DEFAULT_USER_SETTINGS.agent.personality,
      adviceFrequency: FREQUENCIES.includes(
        row.advice_frequency as AdviceFrequency,
      )
        ? (row.advice_frequency as AdviceFrequency)
        : DEFAULT_USER_SETTINGS.agent.adviceFrequency,
    },
    location: {
      city: row.city,
      alerts: {
        zonda: row.alert_zonda,
        frost: row.alert_frost,
        hail: row.alert_hail,
        heatwave: row.alert_heatwave,
        wateringReminder: row.alert_watering_reminder,
      },
      tempUnit: UNITS.includes(row.temp_unit as TempUnit)
        ? (row.temp_unit as TempUnit)
        : "celsius",
      lat: row.latitude ?? undefined,
      lng: row.longitude ?? undefined,
    },
  }
}

/** Lee los settings del usuario; devuelve defaults si no hay fila. */
export async function getUserSettings(
  userEmail: string,
): Promise<UserSettings> {
  const rows = (await sql`
    SELECT user_email, profile_name, profile_email, agent_personality,
           advice_frequency, city, alert_zonda, alert_frost, alert_hail,
           alert_heatwave, alert_watering_reminder, temp_unit,
           latitude, longitude
    FROM user_settings
    WHERE user_email = ${userEmail}
    LIMIT 1
  `) as SettingsRow[]

  if (rows[0]) return rowToSettings(rows[0])
  // Sin fila: devolvemos defaults pero con el mail del usuario prellenado.
  const fallback = structuredClone(DEFAULT_USER_SETTINGS)
  fallback.profile.email = userEmail
  return fallback
}

/** Upsert atómico: crea o actualiza la fila del usuario. */
export async function upsertUserSettings(
  userEmail: string,
  settings: UserSettings,
): Promise<UserSettings> {
  const rows = (await sql`
    INSERT INTO user_settings (
      user_email, profile_name, profile_email, agent_personality,
      advice_frequency, city, alert_zonda, alert_frost, alert_hail,
      alert_heatwave, alert_watering_reminder, temp_unit, updated_at,
      latitude, longitude
    ) VALUES (
      ${userEmail},
      ${settings.profile.name},
      ${settings.profile.email},
      ${settings.agent.personality},
      ${settings.agent.adviceFrequency},
      ${settings.location.city},
      ${settings.location.alerts.zonda},
      ${settings.location.alerts.frost},
      ${settings.location.alerts.hail},
      ${settings.location.alerts.heatwave},
      ${settings.location.alerts.wateringReminder},
      ${settings.location.tempUnit},
      CURRENT_TIMESTAMP,
      ${settings.location.lat ?? null},
      ${settings.location.lng ?? null}
    )
    ON CONFLICT (user_email) DO UPDATE SET
      profile_name = EXCLUDED.profile_name,
      profile_email = EXCLUDED.profile_email,
      agent_personality = EXCLUDED.agent_personality,
      advice_frequency = EXCLUDED.advice_frequency,
      city = EXCLUDED.city,
      alert_zonda = EXCLUDED.alert_zonda,
      alert_frost = EXCLUDED.alert_frost,
      alert_hail = EXCLUDED.alert_hail,
      alert_heatwave = EXCLUDED.alert_heatwave,
      alert_watering_reminder = EXCLUDED.alert_watering_reminder,
      temp_unit = EXCLUDED.temp_unit,
      latitude = EXCLUDED.latitude,
      longitude = EXCLUDED.longitude,
      updated_at = CURRENT_TIMESTAMP
    RETURNING user_email, profile_name, profile_email, agent_personality,
              advice_frequency, city, alert_zonda, alert_frost, alert_hail,
              alert_heatwave, alert_watering_reminder, temp_unit,
              latitude, longitude
  `) as SettingsRow[]
  return rowToSettings(rows[0])
}
