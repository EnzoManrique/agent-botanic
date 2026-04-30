"use client"

import { useCallback } from "react"
import { useSession, signOut } from "next-auth/react"
import { loginAction, registerAction } from "@/lib/actions/auth"

/**
 * Hook que envuelve `useSession` de NextAuth y expone una API similar
 * a la del prototipo anterior (login / register / logout).
 *
 * - `user` viene del JWT firmado por Auth.js (cookie httpOnly).
 * - `login` llama al Credentials provider vía `signIn` (sin redirección
 *   automática así podemos manejar errores).
 * - `register` invoca el server action que inserta en Postgres y luego
 *   inicia sesión automáticamente.
 */
export type AuthUser = {
  id: string
  email: string
  name: string
}

export function useAuth() {
  const { data: session, status, update } = useSession()
  const user: AuthUser | null = session?.user
    ? {
        id: (session.user as { id?: string }).id ?? "",
        email: session.user.email ?? "",
        name: session.user.name ?? "",
      }
    : null

  const login = useCallback(
    async (email: string, password: string): Promise<AuthUser> => {
      // Usamos el server action en vez del signIn del cliente, para evitar el
      // bug de Auth.js v5 beta + Next 16 con HTTPS proxiado en el preview.
      const result = await loginAction({ email, password })
      if (!result.ok) {
        throw new Error(result.error)
      }
      // El cookie de sesión ya está seteado por el server action; pedimos a
      // useSession que vuelva a leer la sesión.
      const fresh = await update()
      return {
        id: (fresh?.user as { id?: string })?.id ?? "",
        email: fresh?.user?.email ?? email,
        name: fresh?.user?.name ?? email.split("@")[0],
      }
    },
    [update],
  )

  const register = useCallback(
    async (input: {
      email: string
      name: string
      password: string
    }): Promise<AuthUser> => {
      const result = await registerAction(input)
      if (!result.ok) {
        throw new Error(result.error)
      }
      const fresh = await update()
      return {
        id: (fresh?.user as { id?: string })?.id ?? "",
        email: fresh?.user?.email ?? input.email,
        name: fresh?.user?.name ?? input.name,
      }
    },
    [update],
  )

  const loginWithProvider = useCallback(async (_provider: "google" | "apple"): Promise<AuthUser> => {
    throw new Error("Por ahora solo está disponible el ingreso con mail.")
  }, [])

  const logout = useCallback(async () => {
    await signOut({ redirect: false })
  }, [])

  const requestReset = useCallback(async (_email: string) => {
    // Pendiente: implementar reset por email cuando configuremos un mailer
    throw new Error("La recuperación de contraseña aún no está disponible.")
  }, [])

  return {
    user,
    loading: status === "loading",
    login,
    register,
    loginWithProvider,
    logout,
    requestReset,
  }
}
