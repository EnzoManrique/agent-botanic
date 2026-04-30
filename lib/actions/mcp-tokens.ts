"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import {
  createMcpToken,
  deleteMcpToken,
  listMcpTokens,
  type McpTokenRow,
} from "@/lib/db/mcp-tokens"

/**
 * Server actions que la pantalla /perfil/integraciones usa para crear,
 * listar y borrar API tokens del usuario logueado.
 */

async function requireUser(): Promise<string> {
  const session = await auth()
  if (!session?.user?.email) {
    throw new Error("UNAUTHORIZED")
  }
  return session.user.email
}

export async function loadMcpTokensAction(): Promise<McpTokenRow[]> {
  const email = await requireUser()
  return listMcpTokens(email)
}

/**
 * Crea un token nuevo. El plaintext sólo viaja UNA vez en la respuesta —
 * el cliente lo guarda en estado local y lo borra al cerrar el modal.
 */
export async function createMcpTokenAction(formData: FormData): Promise<
  | { ok: true; plaintext: string; row: McpTokenRow }
  | { ok: false; error: string }
> {
  try {
    const email = await requireUser()
    const name = String(formData.get("name") ?? "").trim()
    if (name.length > 60) {
      return { ok: false, error: "El nombre no puede pasar de 60 caracteres." }
    }
    const { row, plaintext } = await createMcpToken(email, name)
    revalidatePath("/perfil/integraciones")
    return { ok: true, plaintext, row }
  } catch (err) {
    console.error("[v0] createMcpTokenAction:", err)
    return { ok: false, error: "No pude crear el token. Probá de nuevo." }
  }
}

export async function deleteMcpTokenAction(
  id: number,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const email = await requireUser()
    const deleted = await deleteMcpToken(email, id)
    if (!deleted) {
      return { ok: false, error: "El token ya no existe." }
    }
    revalidatePath("/perfil/integraciones")
    return { ok: true }
  } catch (err) {
    console.error("[v0] deleteMcpTokenAction:", err)
    return { ok: false, error: "No pude borrar el token." }
  }
}
