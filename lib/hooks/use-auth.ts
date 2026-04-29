"use client"

import { useCallback, useEffect, useState } from "react"
import * as authStore from "@/lib/auth"
import type { AuthUser } from "@/lib/auth"

/**
 * Client-side auth hook backed by localStorage. When the real database lands,
 * swap the calls inside the `useCallback`s for server actions — the surface
 * exposed to UI components stays identical.
 */
export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setUser(authStore.getCurrentUser())
    setLoading(false)
  }, [])

  const login = useCallback(
    async (email: string, password: string): Promise<AuthUser> => {
      const u = authStore.loginWithEmail({ email, password })
      setUser(u)
      return u
    },
    [],
  )

  const register = useCallback(
    async (input: {
      email: string
      name: string
      password: string
    }): Promise<AuthUser> => {
      const u = authStore.registerWithEmail(input)
      setUser(u)
      return u
    },
    [],
  )

  const loginWithProvider = useCallback(
    async (provider: "google" | "apple"): Promise<AuthUser> => {
      const u = authStore.loginWithProvider(provider)
      setUser(u)
      return u
    },
    [],
  )

  const logout = useCallback(() => {
    authStore.logout()
    setUser(null)
  }, [])

  const requestReset = useCallback(async (email: string) => {
    return authStore.requestPasswordReset(email)
  }, [])

  return {
    user,
    loading,
    login,
    register,
    loginWithProvider,
    logout,
    requestReset,
  }
}
