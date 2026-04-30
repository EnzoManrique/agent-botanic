import Link from "next/link"
import type { Metadata } from "next"
import { AuthShell } from "@/components/auth/auth-shell"
import { LoginForm } from "@/components/auth/login-form"
import { SocialButtons } from "@/components/auth/social-buttons"

export const metadata: Metadata = {
  title: "Iniciar sesión · Secretary Botanic",
}

export default function LoginPage() {
  return (
    <AuthShell
      title="Volvé al jardín"
      subtitle="Ingresá con tu cuenta para cuidar tus plantas."
      footer={
        <p className="text-muted-foreground">
          ¿Sos nuevo por acá?{" "}
          <Link
            href="/registro"
            className="text-primary font-semibold hover:underline"
          >
            Crear una cuenta
          </Link>
        </p>
      }
    >
      <SocialButtons />

      <div className="my-6 flex items-center gap-3">
        <div className="bg-border h-px flex-1" />
        <span className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
          o con tu mail
        </span>
        <div className="bg-border h-px flex-1" />
      </div>

      <LoginForm />
    </AuthShell>
  )
}
