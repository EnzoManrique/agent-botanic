"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { useAuth } from "@/lib/hooks/use-auth"
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
  const router = useRouter()
  const { loginWithProvider } = useAuth()
  const [pending, setPending] = useState<"google" | "apple" | null>(null)

  async function handle(provider: "google" | "apple") {
    if (pending) return
    setPending(provider)
    try {
      const u = await loginWithProvider(provider)
      toast.success(`Listo, ${u.name.split(" ")[0]}`, {
        description: "Te dejamos en tu jardín.",
      })
      router.push(redirectTo)
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "No pudimos completar el ingreso."
      toast.error(message)
      setPending(null)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <Button
        type="button"
        variant="outline"
        size="lg"
        onClick={() => handle("google")}
        disabled={pending !== null}
        className="border-border bg-card hover:bg-secondary/60 h-12 w-full justify-center gap-3 rounded-2xl border-2 text-sm font-semibold shadow-soft"
      >
        {pending === "google" ? (
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
        onClick={() => handle("apple")}
        disabled={pending !== null}
        className="border-border bg-foreground text-background hover:bg-foreground/90 h-12 w-full justify-center gap-3 rounded-2xl border-2 text-sm font-semibold shadow-soft"
      >
        {pending === "apple" ? (
          <Spinner className="size-4" />
        ) : (
          <AppleIcon className="size-5" />
        )}
        Continuar con Apple
      </Button>
    </div>
  )
}
