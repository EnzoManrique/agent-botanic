/**
 * Local-first auth scaffolding.
 *
 * This file simulates an auth backend using `localStorage` so we can navigate
 * between Login / Register / Forgot-password screens before the real database
 * is wired up. Replace these helpers with server actions + a proper user table
 * when the DB is ready — the public API (`registerWithEmail`, `loginWithEmail`,
 * `loginWithProvider`, `logout`, `requestPasswordReset`) is intentionally
 * shaped so the call sites won't need to change.
 */

export type AuthProvider = "email" | "google" | "apple"

export interface AuthUser {
  id: string
  email: string
  name: string
  provider: AuthProvider
  createdAt: number
}

interface StoredUser extends AuthUser {
  /** Plaintext password — ONLY safe because this is a local prototype. */
  password?: string
}

const USER_KEY = "sb_auth_user"
const DB_KEY = "sb_auth_users"
const RESETS_KEY = "sb_auth_resets"

function isBrowser() {
  return typeof window !== "undefined"
}

function readJSON<T>(key: string, fallback: T): T {
  if (!isBrowser()) return fallback
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function writeJSON(key: string, value: unknown) {
  if (!isBrowser()) return
  window.localStorage.setItem(key, JSON.stringify(value))
}

function newId() {
  return `usr_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

function stripPassword(u: StoredUser): AuthUser {
  const { password: _password, ...rest } = u
  return rest
}

export function getStoredUsers(): StoredUser[] {
  return readJSON<StoredUser[]>(DB_KEY, [])
}

export function getCurrentUser(): AuthUser | null {
  return readJSON<AuthUser | null>(USER_KEY, null)
}

export function setCurrentUser(u: AuthUser | null) {
  if (u) {
    writeJSON(USER_KEY, u)
  } else if (isBrowser()) {
    window.localStorage.removeItem(USER_KEY)
  }
}

export function registerWithEmail({
  email,
  name,
  password,
}: {
  email: string
  name: string
  password: string
}): AuthUser {
  const normalized = email.toLowerCase().trim()
  const users = getStoredUsers()
  if (users.some((u) => u.email.toLowerCase() === normalized)) {
    throw new Error(
      "Ya hay alguien regando con ese mail. ¿Probaste iniciar sesión?",
    )
  }
  const stored: StoredUser = {
    id: newId(),
    email: normalized,
    name: name.trim() || normalized.split("@")[0],
    provider: "email",
    createdAt: Date.now(),
    password,
  }
  users.push(stored)
  writeJSON(DB_KEY, users)
  const publicUser = stripPassword(stored)
  setCurrentUser(publicUser)
  return publicUser
}

export function loginWithEmail({
  email,
  password,
}: {
  email: string
  password: string
}): AuthUser {
  const normalized = email.toLowerCase().trim()
  const users = getStoredUsers()
  const found = users.find((u) => u.email.toLowerCase() === normalized)
  if (!found) {
    throw new Error("No encontramos una cuenta con ese mail. ¿Querés crearla?")
  }
  if (found.provider !== "email") {
    const label = found.provider === "google" ? "Google" : "Apple"
    throw new Error(`Esa cuenta entra con ${label}. Probá ese botón abajo.`)
  }
  if (found.password !== password) {
    throw new Error("La contraseña no coincide. ¿Olvidaste alguna letra?")
  }
  const publicUser = stripPassword(found)
  setCurrentUser(publicUser)
  return publicUser
}

export function loginWithProvider(provider: "google" | "apple"): AuthUser {
  const users = getStoredUsers()
  const syntheticEmail = `demo.${provider}@${provider}.local`
  let found = users.find(
    (u) => u.email === syntheticEmail && u.provider === provider,
  )
  if (!found) {
    found = {
      id: newId(),
      email: syntheticEmail,
      name: provider === "google" ? "Cuenta de Google" : "Cuenta de Apple",
      provider,
      createdAt: Date.now(),
    }
    users.push(found)
    writeJSON(DB_KEY, users)
  }
  const publicUser = stripPassword(found)
  setCurrentUser(publicUser)
  return publicUser
}

export function logout() {
  setCurrentUser(null)
}

export function requestPasswordReset(email: string): boolean {
  const normalized = email.toLowerCase().trim()
  const users = getStoredUsers()
  const found = users.find((u) => u.email.toLowerCase() === normalized)
  if (!found) {
    throw new Error("No tenemos esa dirección registrada. Probá con otra.")
  }
  if (found.provider !== "email") {
    const label = found.provider === "google" ? "Google" : "Apple"
    throw new Error(
      `Esa cuenta entra con ${label}, no necesita resetear contraseña.`,
    )
  }
  const resets = readJSON<Record<string, number>>(RESETS_KEY, {})
  resets[found.email] = Date.now()
  writeJSON(RESETS_KEY, resets)
  return true
}
