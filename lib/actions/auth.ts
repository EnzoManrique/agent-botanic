"use server"

import { z } from "zod"
import bcrypt from "bcryptjs"
import { AuthError } from "next-auth"
import { signIn, signOut } from "@/auth"
import { sql } from "@/lib/db"

/**
 * Server Actions para autenticación.
 *
 * - registerAction: crea un usuario nuevo en la tabla `users` con la contraseña
 *   hasheada con bcrypt y luego inicia sesión automáticamente.
 * - loginAction: valida email + password contra la base usando el Credentials
 *   provider de Auth.js.
 * - logoutAction: cierra la sesión.
 */

const RegisterSchema = z.object({
  name: z.string().trim().min(2, "Tu nombre necesita al menos 2 caracteres."),
  email: z.string().trim().toLowerCase().email("Ese mail no es válido."),
  password: z
    .string()
    .min(6, "La contraseña debe tener al menos 6 caracteres."),
})

const LoginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
})

export type AuthActionResult =
  | { ok: true }
  | { ok: false; error: string }

export async function registerAction(input: {
  name: string
  email: string
  password: string
}): Promise<AuthActionResult> {
  const parsed = RegisterSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos." }
  }
  const { name, email, password } = parsed.data

  try {
    // ¿Existe ya el usuario?
    const existing = await sql`
      SELECT id FROM users WHERE email = ${email} LIMIT 1
    `
    if (existing.length > 0) {
      return {
        ok: false,
        error: "Ya hay alguien regando con ese mail. ¿Probaste iniciar sesión?",
      }
    }

    // Hash de la contraseña (NUNCA guardamos texto plano)
    const hashed = await bcrypt.hash(password, 10)

    await sql`
      INSERT INTO users (email, name, password)
      VALUES (${email}, ${name}, ${hashed})
    `
  } catch (error) {
    console.error("[v0] Error registrando usuario:", error)
    return {
      ok: false,
      error: "No pudimos crear la cuenta. Probá de nuevo en un momento.",
    }
  }

  // Login automático tras el registro
  try {
    await signIn("credentials", {
      email,
      password,
      redirect: false,
    })
    return { ok: true }
  } catch (error) {
    if (error instanceof AuthError) {
      return { ok: false, error: "Cuenta creada, pero falló el inicio de sesión." }
    }
    if (
      error instanceof Error &&
      (error.message === "NEXT_REDIRECT" || error.message.includes("NEXT_"))
    ) {
      throw error
    }
    console.error("[v0] Error en signIn post-registro:", error)
    return { ok: false, error: "Cuenta creada, pero falló el inicio de sesión." }
  }
}

export async function loginAction(input: {
  email: string
  password: string
}): Promise<AuthActionResult> {
  const parsed = LoginSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: "Mail o contraseña inválidos." }
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
    })
    return { ok: true }
  } catch (error) {
    // Auth.js v5 lanza un AuthError cuando las credenciales son inválidas.
    if (error instanceof AuthError) {
      if (error.type === "CredentialsSignin") {
        return {
          ok: false,
          error: "Mail o contraseña incorrectos. Probá de nuevo.",
        }
      }
      return { ok: false, error: "No pudimos iniciar sesión. Intentá de nuevo." }
    }
    // Next.js usa errores especiales internamente para redirects; los relanzamos.
    if (
      error instanceof Error &&
      (error.message === "NEXT_REDIRECT" || error.message.includes("NEXT_"))
    ) {
      throw error
    }
    console.error("[v0] Error en loginAction:", error)
    return { ok: false, error: "No pudimos iniciar sesión. Intentá de nuevo." }
  }
}

export async function logoutAction() {
  // No usamos redirectTo acá: dejamos que el cliente navegue después,
  // así evitamos el throw NEXT_REDIRECT cuando se invoca desde un onClick.
  await signOut({ redirect: false })
}

/**
 * Inicia el flujo de Google OAuth. Esta action devuelve la URL a la que el
 * cliente debe navegar (la pantalla de consentimiento de Google).
 *
 * Por qué no usamos `signIn("google", { redirectTo: "/" })` directo:
 * cuando se llama desde un Server Action, `signIn` lanza un `NEXT_REDIRECT`
 * que el navegador sigue como un GET normal — pero solo si el form action
 * está envuelto correctamente. Lo más robusto es retornar la URL y que el
 * cliente haga `window.location.href = url`, lo que también nos permite
 * mostrar un toast de error si algo falla.
 */
export async function getGoogleSignInUrl(redirectTo = "/"): Promise<
  { ok: true; url: string } | { ok: false; error: string }
> {
  try {
    // signIn con `redirect: false` devuelve la URL en lugar de redirigir.
    const url = await signIn("google", {
      redirect: false,
      redirectTo,
    })
    if (typeof url !== "string") {
      return { ok: false, error: "No pudimos iniciar el flujo con Google." }
    }
    return { ok: true, url }
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message === "NEXT_REDIRECT" || error.message.includes("NEXT_"))
    ) {
      // Auth.js a veces lanza NEXT_REDIRECT incluso con redirect:false en
      // ciertos paths. Lo relanzamos para que Next siga el flujo normal.
      throw error
    }
    console.error("[v0] Error generando Google sign-in URL:", error)
    return { ok: false, error: "No pudimos iniciar el flujo con Google." }
  }
}
