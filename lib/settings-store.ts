import { DEFAULT_USER_SETTINGS, type UserSettings } from "./types"

/**
 * In-memory settings store, attached to globalThis so it survives Next.js
 * dev hot reloads. Will be replaced with Supabase/Neon when the DB is ready.
 */
type SettingsStoreShape = {
  byUser: Map<string, UserSettings>
}

const globalForSettings = globalThis as unknown as {
  __botanicSettings?: SettingsStoreShape
}

function getStore(): SettingsStoreShape {
  if (!globalForSettings.__botanicSettings) {
    globalForSettings.__botanicSettings = { byUser: new Map() }
  }
  return globalForSettings.__botanicSettings
}

const DEFAULT_KEY = "__default__"

export function getSettings(userId: string | null = null): UserSettings {
  const key = userId ?? DEFAULT_KEY
  const stored = getStore().byUser.get(key)
  return stored ?? structuredClone(DEFAULT_USER_SETTINGS)
}

export function setSettings(
  settings: UserSettings,
  userId: string | null = null,
): UserSettings {
  const key = userId ?? DEFAULT_KEY
  getStore().byUser.set(key, settings)
  return settings
}
