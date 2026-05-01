"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { getGoogleSignInUrl } from "@/lib/actions/auth"
import { toast } from "sonner"

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <path
        fill="#FFC107"
        d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
      />
      <path
        fill="#FF3D00"
        d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
      />
    </svg>
  )
}

function AppleIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M16.365 1.43c0 1.14-.493 2.27-1.177 3.08-.744.9-1.967 1.578-2.987 1.498-.12-1.117.461-2.275 1.116-3.067.744-.9 2.05-1.59 3.048-1.51zm4.182 17.057c-.55 1.27-.815 1.838-1.526 2.96-.99 1.566-2.388 3.514-4.123 3.532-1.541.012-1.94-.997-4.025-.987-2.085.012-2.526.999-4.066.987-1.735-.018-3.056-1.773-4.046-3.338C.022 17.262-.244 12.084 1.49 9.346c1.247-1.972 3.218-3.124 5.072-3.124 1.886 0 3.073.99 4.624.99 1.504 0 2.42-1.001 4.604-1.001 1.65 0 3.395.85 4.643 2.32-4.087 2.157-3.42 7.847.114 8.956z" />
    </svg>
  )
}

interface SocialButtonsProps {
  /** Where to navigate after a successful provider sign-in. Defaults to "/". */
  redirectTo?: string
}

export function SocialButtons({ redirectTo = "/" }: SocialButtonsProps) {
  const [pending, setPending] = useState(false)

  async function handleGoogle() {
    if (pending) return
    setPending(true)
    try {
      const res = await getGoogleSignInUrl(redirectTo)
      if (!res.ok) {
        toast.error(res.error)
        setPending(false)
        return
      }
      // Navegamos al consent screen de Google. Después de que el usuario
      // autorice, Google rebota a /api/auth/callback/google y Auth.js termina
      // dejándolo en `redirectTo`.
      window.location.href = res.url
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "No pudimos abrir el ingreso con Google.",
      )
      setPending(false)
    }
  }

  function handleApple() {
    // Apple Sign-In requiere una cuenta de Apple Developer ($99/año) para
    // generar el client_secret JWT. Lo dejamos visible pero deshabilitado
    // para que la UI quede completa de cara al demo.
    toast.info("Apple llega pronto", {
      description: "Por ahora podés entrar con Google o con tu mail.",
    })
  }

  return (
    <div className="flex flex-col gap-3">
      <Button
        type="button"
        variant="outline"
        size="lg"
        onClick={handleGoogle}
        disabled={pending}
        className="border-border bg-card hover:bg-secondary/60 h-12 w-full justify-center gap-3 rounded-2xl border-2 text-sm font-semibold shadow-soft"
      >
        {pending ? (
          <Spinner className="size-4" />
        ) : (
          <GoogleIcon className="size-5" />
        )}
        Continuar con Google
      </Button>
      <Button
        type="button"
        variant="outline"
        size="lg"
        onClick={handleApple}
        disabled={pending}
        aria-label="Continuar con Apple (próximamente)"
        title="Próximamente"
        className="border-border bg-foreground/90 text-background hover:bg-foreground relative h-12 w-full justify-center gap-3 rounded-2xl border-2 text-sm font-semibold shadow-soft"
      >
        <AppleIcon className="size-5" />
        Continuar con Apple
        <span className="bg-background/15 absolute right-3 rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase">
          Pronto
        </span>
      </Button>
    </div>
  )
}
