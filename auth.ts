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
 * Soporta dos formas de iniciar sesión:
 * 1. Credentials (email + password) — valida contra `users` con bcrypt.
 * 2. Google OAuth — primera vez crea/upserta el user en `users` con
 *    provider='google' y password=null. Las veces siguientes simplemente
 *    matchea por email.
 *
 * NextAuth crea la sesión como JWT firmado con AUTH_SECRET, en cookie
 * httpOnly.
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

/**
 * Inserta el usuario si es la primera vez que entra con Google, o devuelve
 * el id existente si ya estaba en la base. No toca el password — los users
 * de OAuth tienen password=null.
 */
async function upsertOAuthUser(input: {
  email: string
  name: string
  imageUrl?: string | null
  provider: string
}): Promise<{ id: number } | null> {
  try {
    const rows = (await sql`
      INSERT INTO users (email, name, provider, image_url)
      VALUES (${input.email}, ${input.name}, ${input.provider}, ${input.imageUrl ?? null})
      ON CONFLICT (email) DO UPDATE
        SET name = EXCLUDED.name,
            image_url = COALESCE(EXCLUDED.image_url, users.image_url)
      RETURNING id
    `) as { id: number }[]
    return rows[0] ?? null
  } catch (error) {
    console.error("[v0] Error en upsertOAuthUser:", error)
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
        if (!user || !user.password) {
          // Si el user no existe, o existe pero entró por OAuth (sin password),
          // rechazamos el login por credentials. Hay que entrar por Google.
          return null
        }

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
    Google({
      // Auth.js lee AUTH_GOOGLE_ID / AUTH_GOOGLE_SECRET del env automáticamente,
      // pero ser explícito ayuda a documentar qué necesita el proyecto.
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      // Le decimos a Google que devuelva siempre el "consent screen" cuando
      // pasa más de un día, así si el usuario revoca permisos los re-pide.
      authorization: {
        params: { prompt: "select_account" },
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    /**
     * Se ejecuta antes del callback `jwt`. Nos sirve para:
     *  - Upsertar el usuario de Google en nuestra tabla la primera vez.
     *  - Inyectar nuestro id de DB en el `user.id` (en vez del id de Google).
     */
    async signIn({ user, account, profile }) {
      // Solo nos interesa interceptar el flujo de Google. Credentials ya viene
      // resuelto desde authorize().
      if (account?.provider !== "google") return true

      const email = (user.email ?? profile?.email ?? "").toLowerCase().trim()
      if (!email) {
        console.error("[v0] Google no devolvió email; rechazamos.")
        return false
      }

      const name = user.name ?? (profile?.name as string | undefined) ?? "Usuaria/o"
      const imageUrl =
        user.image ?? (profile?.picture as string | undefined) ?? null

      const upserted = await upsertOAuthUser({
        email,
        name,
        imageUrl,
        provider: "google",
      })
      if (!upserted) {
        console.error("[v0] No pudimos upsertar el user de Google.")
        return false
      }

      // Reescribimos el id que viaja al callback `jwt`. Después de esto,
      // session.user.id va a ser el id de nuestra DB (numérico como string),
      // que es lo que el resto de la app espera.
      user.id = String(upserted.id)
      return true
    },
  },
})
