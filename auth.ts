import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import Google from "next-auth/providers/google"
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
  callbacks: {
    ...authConfig.callbacks,
    /**
     * Se ejecuta una vez por OAuth flow exitoso, ANTES de que se cree el JWT.
     * Acá hacemos un upsert del usuario de Google en nuestra tabla `users` y
     * mutamos `user.id` para que apunte al PK numérico de Postgres (no al ID
     * de Google). Si lo dejáramos como ID de Google, todas las queries por
     * `user_email` seguirían funcionando, pero `session.user.id` sería distinto
     * al de credentials, y eso rompería el invariante que asume el resto del
     * código.
     */
    async signIn({ user, account }) {
      // Para credentials, ya hicimos todo en authorize. No hay nada que upsertar.
      if (account?.provider !== "google") return true

      if (!user.email || !user.name) {
        console.error("[v0] Google no devolvió email/name; rechazando login")
        return false
      }

      const email = user.email.toLowerCase().trim()
      try {
        const rows = (await sql`
          INSERT INTO users (email, name, image_url, provider)
          VALUES (${email}, ${user.name}, ${user.image ?? null}, 'google')
          ON CONFLICT (email) DO UPDATE
            SET name = EXCLUDED.name,
                image_url = EXCLUDED.image_url
          RETURNING id, name, email
        `) as { id: number; name: string; email: string }[]

        const dbUser = rows[0]
        if (!dbUser) return false

        // Mutamos el user para que el siguiente callback (jwt) reciba el id de DB.
        user.id = String(dbUser.id)
        user.name = dbUser.name
        user.email = dbUser.email
        return true
      } catch (error) {
        console.error("[v0] Error upserteando usuario de Google:", error)
        return false
      }
    },
  },
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      // `account_selection`: si el usuario tiene varias cuentas Google logueadas
      // en el browser, le mostramos el chooser explícito. Mejor UX que entrar
      // automáticamente con la "principal".
      authorization: { params: { prompt: "select_account" } },
    }),
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

        // Si el user existe pero se registró con Google, no tiene password.
        // Devolvemos null para que el flujo de credentials falle limpio.
        if (!user.password) return null

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
