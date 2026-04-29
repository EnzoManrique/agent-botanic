"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Lock, Mail, User } from "lucide-react"
import {
  Field,
  FieldDescription,
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
  name?: string
  email?: string
  password?: string
  form?: string
}

const EMAIL_RE = /^\S+@\S+\.\S+$/

export function RegisterForm() {
  const router = useRouter()
  const { register } = useAuth()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPwd, setShowPwd] = useState(false)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [pending, setPending] = useState(false)

  function validate(): FieldErrors {
    const next: FieldErrors = {}
    if (!name.trim()) {
      next.name = "¿Cómo querés que te llamemos?"
    } else if (name.trim().length < 2) {
      next.name = "Un nombre tan cortito no nos alcanza."
    }
    if (!email.trim()) {
      next.email = "Necesitamos un mail para escribirte."
    } else if (!EMAIL_RE.test(email.trim())) {
      next.email = "Mmm, ese mail no me cierra. ¿Lo escribiste bien?"
    }
    if (!password) {
      next.password = "Elegí una contraseña."
    } else if (password.length < 6) {
      next.password =
        "Esa contraseña tiene menos hojas que un cactus: al menos 6 caracteres."
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
      const u = await register({
        name: name.trim(),
        email: email.trim(),
        password,
      })
      toast.success(`Bienvenida/o, ${u.name.split(" ")[0]}`, {
        description: "Tu jardín digital recién plantado.",
      })
      router.push("/")
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "No pudimos crear la cuenta. Probá de nuevo."
      setErrors({ form: message })
      setPending(false)
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      <FieldGroup className="gap-5">
        <Field data-invalid={errors.name ? true : undefined}>
          <FieldLabel htmlFor="name">Nombre</FieldLabel>
          <InputGroup className="border-border bg-card h-12 rounded-2xl border-2 shadow-soft">
            <InputGroupAddon>
              <User className="size-4" aria-hidden="true" />
            </InputGroupAddon>
            <InputGroupInput
              id="name"
              type="text"
              autoComplete="name"
              placeholder="Cómo te llamás"
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                if (errors.name) setErrors((p) => ({ ...p, name: undefined }))
              }}
              aria-invalid={errors.name ? true : undefined}
            />
          </InputGroup>
          {errors.name ? <FieldError>{errors.name}</FieldError> : null}
        </Field>

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
              autoComplete="new-password"
              placeholder="Mínimo 6 caracteres"
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
          {errors.password ? (
            <FieldError>{errors.password}</FieldError>
          ) : (
            <FieldDescription>
              Mezclá letras y números para que tu jardín esté bien protegido.
            </FieldDescription>
          )}
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
            Plantando tu cuenta…
          </>
        ) : (
          "Crear cuenta"
        )}
      </Button>

      <p className="text-muted-foreground text-center text-xs leading-relaxed">
        Al continuar aceptás nuestros{" "}
        <span className="text-foreground font-semibold">Términos</span> y la{" "}
        <span className="text-foreground font-semibold">
          Política de privacidad
        </span>
        .
      </p>
    </form>
  )
}
