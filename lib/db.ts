import { neon } from "@neondatabase/serverless"

/**
 * Cliente SQL para Neon / Vercel Postgres.
 *
 * Vercel inyecta automáticamente POSTGRES_URL cuando conectás una base de
 * datos Neon al proyecto. Usamos esa variable como connection string.
 *
 * Uso:
 *   const rows = await sql`SELECT * FROM users WHERE email = ${email}`
 */
const connectionString =
  process.env.POSTGRES_URL ||
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL_NON_POOLING

if (!connectionString) {
  throw new Error(
    "Falta POSTGRES_URL (o DATABASE_URL) en las variables de entorno.",
  )
}

export const sql = neon(connectionString)

export interface DbUser {
  id: number
  email: string
  name: string
  password: string
  created_at: string
}
