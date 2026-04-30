import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { z } from "zod"
import { authConfig } from "./auth.config"
import { sql, type DbUser } from "@/lib/db"

/**
 * Configuración principal de Auth.js (NextAuth v5).
 *
 * - Usa el Credentials Provider (email + password).
 * - Valida los inputs con zod.
 * - Busca el usuario en la tabla `users` de Postgres.
 * - Compara el password con bcrypt.
 *
 * Si todo está OK devuelve los datos del usuario y NextAuth crea la sesión
 * (un JWT firmado con AUTH_SECRET, guardado en una cookie httpOnly).
 */

async function getUserByEmail(email: string): Promise<DbUser | null> {
  try {
    const rows = (await sql`
      SELECT id, email, name, password, created_at
      FROM users
      WHERE email = ${email}
      LIMIT 1
    `) as DbUser[]
    return rows[0] ?? null
  } catch (error) {
    console.error("[v0] Error buscando usuario:", error)
    return null
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  // Pasamos el secret explícitamente. NextAuth v5 también lo lee solo de
  // process.env.AUTH_SECRET, pero ser explícito evita errores raros en
  // ambientes con proxies / preview deployments.
  secret: process.env.AUTH_SECRET,
  // El sandbox de v0 / preview de Vercel sirve la app detrás de un proxy con
  // un host distinto al esperado. Sin trustHost, Auth.js corta el handshake.
  trustHost: true,
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsed = z
          .object({
            email: z.string().email(),
            password: z.string().min(1),
          })
          .safeParse(credentials)

        if (!parsed.success) return null

        const { email, password } = parsed.data
        const user = await getUserByEmail(email.toLowerCase().trim())
        if (!user) return null

        const ok = await bcrypt.compare(password, user.password)
        if (!ok) return null

        // Lo que devolvemos acá termina dentro del JWT (callbacks.jwt)
        return {
          id: String(user.id),
          email: user.email,
          name: user.name,
        }
      },
    }),
  ],
})
