import type { NextAuthConfig } from "next-auth"

/**
 * Configuración "edge-safe" de Auth.js.
 *
 * Este archivo NO importa nada que use Node APIs (como bcryptjs o el cliente
 * de Postgres) para que pueda ejecutarse dentro del middleware/proxy en el
 * runtime Edge. La lógica pesada (validar contra la base, upsert de OAuth)
 * vive en `auth.ts`.
 */

// Rutas de auth (públicas). Todo lo demás requiere sesión.
const AUTH_PREFIXES = ["/login", "/registro", "/olvide-contrasena"]

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const path = nextUrl.pathname

      const isAuthPage = AUTH_PREFIXES.some((p) => path.startsWith(p))

      // Si está en una página de auth y ya tiene sesión, lo mandamos al home
      if (isAuthPage) {
        if (isLoggedIn) {
          return Response.redirect(new URL("/", nextUrl))
        }
        return true
      }

      // Cualquier otra ruta requiere sesión.
      // Devolver `false` hace que Auth.js redirija a /login automáticamente.
      return isLoggedIn
    },
    async jwt({ token, user }) {
      // En el primer login, copiamos los datos del usuario al token.
      // Para OAuth, `user.id` puede no ser nuestro id de DB todavía; en ese
      // caso lo refrescamos desde la base la primera vez que hace falta
      // (lo resuelve el callback signIn de auth.ts antes de llegar acá).
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
