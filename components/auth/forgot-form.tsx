"use client"

import { useState } from "react"
import Link from "next/link"
import { CheckCircle2, Mail } from "lucide-react"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { useAuth } from "@/lib/hooks/use-auth"

interface FieldErrors {
  email?: string
  form?: string
}

const EMAIL_RE = /^\S+@\S+\.\S+$/

export function ForgotForm() {
  const { requestReset } = useAuth()
  const [email, setEmail] = useState("")
  const [errors, setErrors] = useState<FieldErrors>({})
  const [pending, setPending] = useState(false)
  const [sentTo, setSentTo] = useState<string | null>(null)

  function validate(): FieldErrors {
    const next: FieldErrors = {}
    if (!email.trim()) {
      next.email = "Necesitamos saber a qué mail mandarte el link."
    } else if (!EMAIL_RE.test(email.trim())) {
      next.email = "Ese mail tiene cara rara. ¿Lo revisás?"
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
      await requestReset(email.trim())
      setSentTo(email.trim())
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "No pudimos enviar el mail. Probá de nuevo."
      setErrors({ form: message })
    } finally {
      setPending(false)
    }
  }

  if (sentTo) {
    return (
      <div className="flex flex-col gap-5">
        <div className="border-primary/30 bg-primary/10 flex items-start gap-3 rounded-2xl border-2 px-4 py-4">
          <CheckCircle2
            className="text-primary mt-0.5 size-5 shrink-0"
            aria-hidden="true"
          />
          <div className="flex-1">
            <p className="text-foreground text-sm font-semibold leading-snug">
              Listo, te mandamos un link
            </p>
            <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
              Revisá <span className="text-foreground font-semibold">{sentTo}</span>{" "}
              (y la carpeta de spam, por las dudas). El link expira en 30
              minutos.
            </p>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={() => {
            setSentTo(null)
            setEmail("")
          }}
          className="border-border bg-card hover:bg-secondary/60 h-12 w-full rounded-2xl border-2 text-sm font-semibold shadow-soft"
        >
          Probar con otro mail
        </Button>

        <Link
          href="/login"
          className="text-primary text-center text-sm font-semibold hover:underline"
        >
          Volver al inicio de sesión
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      <FieldGroup>
        <Field data-invalid={errors.email ? true : undefined}>
          <FieldLabel htmlFor="email">Mail de tu cuenta</FieldLabel>
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
      </FieldGroup>

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
            Buscando tu cuenta…
          </>
        ) : (
          "Enviar link de recuperación"
        )}
      </Button>
    </form>
  )
}
