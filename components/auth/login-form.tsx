"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Lock, Mail } from "lucide-react"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { useAuth } from "@/lib/hooks/use-auth"
import { toast } from "sonner"

interface FieldErrors {
  email?: string
  password?: string
  form?: string
}

const EMAIL_RE = /^\S+@\S+\.\S+$/

export function LoginForm() {
  const router = useRouter()
  const { login } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPwd, setShowPwd] = useState(false)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [pending, setPending] = useState(false)

  function validate(): FieldErrors {
    const next: FieldErrors = {}
    if (!email.trim()) {
      next.email = "Necesitamos un mail para encontrarte."
    } else if (!EMAIL_RE.test(email.trim())) {
      next.email = "Mmm, ese mail no me cierra. ¿Lo escribiste bien?"
    }
    if (!password) {
      next.password = "Sin contraseña no entramos al jardín."
    }
    return next
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    const v = validate()
    setErrors(v)
    if (Object.keys(v).length) return
    setPending(true)
    try {
      const u = await login(email.trim(), password)
      toast.success(`¡Hola, ${u.name.split(" ")[0]}!`, {
        description: "Tus plantas te estaban esperando.",
      })
      router.push("/")
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Algo salió mal. Intentá de nuevo."
      setErrors({ form: message })
      setPending(false)
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      <FieldGroup className="gap-5">
        <Field data-invalid={errors.email ? true : undefined}>
          <FieldLabel htmlFor="email">Mail</FieldLabel>
          <InputGroup className="border-border bg-card h-12 rounded-2xl border-2 shadow-soft">
            <InputGroupAddon>
              <Mail className="size-4" aria-hidden="true" />
            </InputGroupAddon>
            <InputGroupInput
              id="email"
              type="email"
              autoComplete="email"
              inputMode="email"
              placeholder="vos@ejemplo.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                if (errors.email) setErrors((p) => ({ ...p, email: undefined }))
              }}
              aria-invalid={errors.email ? true : undefined}
            />
          </InputGroup>
          {errors.email ? <FieldError>{errors.email}</FieldError> : null}
        </Field>

        <Field data-invalid={errors.password ? true : undefined}>
          <FieldLabel htmlFor="password">Contraseña</FieldLabel>
          <InputGroup className="border-border bg-card h-12 rounded-2xl border-2 shadow-soft">
            <InputGroupAddon>
              <Lock className="size-4" aria-hidden="true" />
            </InputGroupAddon>
            <InputGroupInput
              id="password"
              type={showPwd ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Tu contraseña secreta"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                if (errors.password)
                  setErrors((p) => ({ ...p, password: undefined }))
              }}
              aria-invalid={errors.password ? true : undefined}
            />
            <InputGroupAddon align="inline-end">
              <InputGroupButton
                type="button"
                size="icon-sm"
                onClick={() => setShowPwd((s) => !s)}
                aria-label={
                  showPwd ? "Ocultar contraseña" : "Mostrar contraseña"
                }
              >
                {showPwd ? (
                  <EyeOff className="size-4" aria-hidden="true" />
                ) : (
                  <Eye className="size-4" aria-hidden="true" />
                )}
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
          {errors.password ? <FieldError>{errors.password}</FieldError> : null}
        </Field>
      </FieldGroup>

      <Link
        href="/olvide-contrasena"
        className="text-primary -mt-1 self-end text-sm font-semibold hover:underline"
      >
        ¿Olvidaste tu contraseña?
      </Link>

      {errors.form ? (
        <p
          role="alert"
          className="border-destructive/30 bg-destructive/10 text-destructive rounded-2xl border-2 px-4 py-3 text-sm font-medium leading-relaxed"
        >
          {errors.form}
        </p>
      ) : null}

      <Button
        type="submit"
        size="lg"
        disabled={pending}
        className="bg-primary hover:bg-primary/90 text-primary-foreground h-12 w-full rounded-2xl text-base font-semibold shadow-soft"
      >
        {pending ? (
          <>
            <Spinner className="size-4" />
            Entrando…
          </>
        ) : (
          "Iniciar sesión"
        )}
      </Button>
    </form>
  )
}
