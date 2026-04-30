import type { DefaultSession } from "next-auth"

/**
 * Extiende los tipos de NextAuth para incluir `id` dentro de `session.user`.
 * Esto evita los errores de TypeScript al leer `session.user.id`.
 */
declare module "next-auth" {
  interface Session {
    user: {
      id: string
    } & DefaultSession["user"]
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string
  }
}
