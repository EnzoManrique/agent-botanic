import NextAuth from "next-auth"
import { authConfig } from "./auth.config" // Ahora creamos este

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    // Aquí podrías agregar Google o GitHub más adelante
  ],
})