import type { NextAuthConfig } from "next-auth"

/**
 * Configuración "edge-safe" de Auth.js.
 *
 * Este archivo NO importa nada que use Node APIs (como bcryptjs o el cliente
 * de Postgres) para que pueda ejecutarse dentro del middleware/proxy en el
 * runtime Edge. La lógica pesada (validar contra la base) vive en `auth.ts`.
 */

// Rutas que solo se pueden visitar estando logueado
const PROTECTED_PREFIXES = ["/jardin", "/perfil", "/agente", "/escanear"]
// Rutas de auth: si ya estás logueado, no tiene sentido entrar
const AUTH_PREFIXES = ["/login", "/registro", "/olvide-contrasena"]

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const path = nextUrl.pathname

      const isProtected = PROTECTED_PREFIXES.some((p) => path.startsWith(p))
      const isAuthPage = AUTH_PREFIXES.some((p) => path.startsWith(p))

      // Bloqueá el ingreso a rutas privadas si no hay sesión
      if (isProtected && !isLoggedIn) {
        return false // Auth.js redirige a /login automáticamente
      }

      // Si ya está logueado, evitamos que vea login/registro
      if (isAuthPage && isLoggedIn) {
        return Response.redirect(new URL("/", nextUrl))
      }

      return true
    },
    async jwt({ token, user }) {
      // En el primer login, copiamos los datos del usuario al token
      if (user) {
        token.id = user.id
        token.email = user.email
        token.name = user.name
      }
      return token
    },
    async session({ session, token }) {
      // Exponemos el id en session.user para usarlo desde la app
      if (session.user && token) {
        session.user.id = token.id as string
        session.user.email = token.email as string
        session.user.name = token.name as string
      }
      return session
    },
  },
  providers: [], // los providers se agregan en auth.ts (no edge-safe)
} satisfies NextAuthConfig
