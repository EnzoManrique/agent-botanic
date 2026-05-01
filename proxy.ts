import NextAuth from "next-auth"
import { authConfig } from "./auth.config"

/**
 * Proxy (antes "middleware") de Next.js 16.
 *
 * Auth.js corre el callback `authorized` de auth.config.ts en cada request
 * que matchee el `matcher` de abajo. Si la ruta es protegida y no hay sesión,
 * te manda al login automáticamente.
 *
 * Importante: usamos solo `authConfig` (sin providers ni bcryptjs) para que
 * pueda ejecutarse en el runtime Edge.
 */
export default NextAuth(authConfig).auth

export const config = {
  // No correr el proxy sobre archivos estáticos ni rutas internas
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
}
