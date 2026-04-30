import "server-only"
import { createHash, randomBytes } from "node:crypto"
import { sql } from "@/lib/db"

/**
 * Capa de datos para `mcp_tokens` — los API tokens que el usuario genera
 * desde /perfil/integraciones para que clientes externos (Claude Desktop,
 * Apple Shortcuts, futuros bots) consulten su jardín por MCP.
 *
 * Decisiones de seguridad:
 * - Nunca guardamos el token en plano. Guardamos `token_hash` (SHA-256).
 * - Mostramos al usuario un `prefix` (los primeros 12 chars) para que
 *   pueda identificarlo en la lista, pero el secret completo solo se ve
 *   UNA vez al crearlo.
 * - El formato del token es `botanic_<32 hex>` para que sea reconocible.
 */

export interface McpTokenRow {
  id: number
  name: string
  prefix: string
  createdAt: string
  lastUsedAt: string | null
}

interface RawRow {
  id: number
  user_email: string
  name: string
  token_hash: string
  prefix: string
  created_at: string
  last_used_at: string | null
}

/** Genera un token aleatorio + lo persiste hasheado. Devuelve el plano UNA vez. */
export async function createMcpToken(
  userEmail: string,
  name: string,
): Promise<{ row: McpTokenRow; plaintext: string }> {
  // 32 hex chars = 16 random bytes; suficiente para hackathon y compacto.
  const secret = randomBytes(16).toString("hex")
  const plaintext = `botanic_${secret}`
  const tokenHash = sha256(plaintext)
  const prefix = plaintext.slice(0, 12) // "botanic_xxxx"
  const cleanName = name.trim() || "Token sin nombre"

  const rows = (await sql`
    INSERT INTO mcp_tokens (user_email, name, token_hash, prefix)
    VALUES (${userEmail}, ${cleanName}, ${tokenHash}, ${prefix})
    RETURNING id, user_email, name, token_hash, prefix, created_at, last_used_at
  `) as RawRow[]

  return { row: toPublic(rows[0]), plaintext }
}

/** Lista los tokens del usuario, sin exponer el hash. */
export async function listMcpTokens(userEmail: string): Promise<McpTokenRow[]> {
  const rows = (await sql`
    SELECT id, user_email, name, token_hash, prefix, created_at, last_used_at
    FROM mcp_tokens
    WHERE user_email = ${userEmail}
    ORDER BY created_at DESC
  `) as RawRow[]
  return rows.map(toPublic)
}

/** Borra un token (solo si pertenece al usuario). */
export async function deleteMcpToken(
  userEmail: string,
  id: number,
): Promise<boolean> {
  const result = (await sql`
    DELETE FROM mcp_tokens
    WHERE id = ${id} AND user_email = ${userEmail}
  `) as { count?: number }
  // neon-serverless devuelve { count } o un array vacío según la versión.
  return (result.count ?? 0) > 0
}

/**
 * Resuelve un token plain → user_email. Si el token existe, también
 * actualiza `last_used_at` para que el usuario vea actividad en la UI.
 * Si no existe, devuelve null (NO lanza). El caller decide el 401.
 */
export async function resolveMcpToken(
  plaintext: string,
): Promise<{ userEmail: string; tokenId: number } | null> {
  if (!plaintext || !plaintext.startsWith("botanic_")) return null
  const tokenHash = sha256(plaintext)

  const rows = (await sql`
    SELECT id, user_email
    FROM mcp_tokens
    WHERE token_hash = ${tokenHash}
    LIMIT 1
  `) as { id: number; user_email: string }[]

  if (!rows[0]) return null

  // Fire-and-forget: no bloqueamos el request del agente esperando este UPDATE.
  // Si falla, no afecta al pedido — solo perdemos un timestamp.
  void sql`
    UPDATE mcp_tokens SET last_used_at = NOW() WHERE id = ${rows[0].id}
  `.catch((err) => {
    console.error("[v0] Error actualizando last_used_at:", err)
  })

  return { userEmail: rows[0].user_email, tokenId: rows[0].id }
}

function sha256(input: string): string {
  return createHash("sha256").update(input).digest("hex")
}

function toPublic(row: RawRow): McpTokenRow {
  return {
    id: row.id,
    name: row.name,
    prefix: row.prefix,
    createdAt: row.created_at,
    lastUsedAt: row.last_used_at,
  }
}
