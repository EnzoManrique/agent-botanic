/**
 * Endpoint que expone los handlers de Auth.js.
 * NextAuth maneja internamente: /api/auth/signin, /api/auth/signout,
 * /api/auth/session, /api/auth/callback/credentials, etc.
 */
import { handlers } from "@/auth"

export const { GET, POST } = handlers
