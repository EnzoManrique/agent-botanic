import Link from "next/link"
import type { Metadata } from "next"
import { AuthShell } from "@/components/auth/auth-shell"
import { RegisterForm } from "@/components/auth/register-form"
import { SocialButtons } from "@/components/auth/social-buttons"

export const metadata: Metadata = {
  title: "Crear cuenta · Secretary Botanic",
}

export default function RegistroPage() {
  return (
    <AuthShell
      title="Plantá tu jardín digital"
      subtitle="Sumate y empezá a cuidar tus plantas con un asistente que sabe del clima de Mendoza."
      back={{ href: "/login", label: "Iniciar sesión" }}
      footer={
        <p className="text-muted-foreground">
          ¿Ya tenés cuenta?{" "}
          <Link
            href="/login"
            className="text-primary font-semibold hover:underline"
          >
            Iniciá sesión
          </Link>
        </p>
      }
    >
      <SocialButtons redirectTo="/" />

      <div className="my-6 flex items-center gap-3">
        <div className="bg-border h-px flex-1" />
        <span className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
          o con tu mail
        </span>
        <div className="bg-border h-px flex-1" />
      </div>

      <RegisterForm />
    </AuthShell>
  )
}
