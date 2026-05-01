import type { Metadata } from "next"
import { AuthShell } from "@/components/auth/auth-shell"
import { ForgotForm } from "@/components/auth/forgot-form"

export const metadata: Metadata = {
  title: "Recuperar contraseña · Secretary Botanic",
}

export default function OlvideContrasenaPage() {
  return (
    <AuthShell
      title="Reseteamos esa contraseña"
      subtitle="Decinos a qué mail enviarte el link para crear una nueva."
      back={{ href: "/login", label: "Iniciar sesión" }}
    >
      <ForgotForm />
    </AuthShell>
  )
}
