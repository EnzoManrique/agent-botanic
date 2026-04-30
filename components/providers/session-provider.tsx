"use client"

import { SessionProvider } from "next-auth/react"
import type { ReactNode } from "react"

/**
 * Envoltorio del SessionProvider de NextAuth.
 * Como SessionProvider necesita correr en cliente, lo aislamos en un
 * componente "use client" para poder usarlo desde el RootLayout (server).
 */
export function AuthSessionProvider({ children }: { children: ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>
}
