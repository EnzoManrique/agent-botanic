"use client"

import { useState } from "react"
import { KeyRound, Mail, User, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Field, FieldGroup, FieldLabel, FieldError } from "@/components/ui/field"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Input } from "@/components/ui/input"
import { SettingsSection } from "./settings-section"
import type { UserSettings } from "@/lib/types"

interface MyProfileCardProps {
  profile: UserSettings["profile"]
  onChange: (profile: UserSettings["profile"]) => void
  emailError?: string
}

export function MyProfileCard({
  profile,
  onChange,
  emailError,
}: MyProfileCardProps) {
  const [editingPassword, setEditingPassword] = useState(false)
  const [pwd, setPwd] = useState({ current: "", next: "", confirm: "" })
  const [showPwd, setShowPwd] = useState(false)
  const [pwdMessage, setPwdMessage] = useState<string | null>(null)

  function applyPasswordChange() {
    if (pwd.next.length < 6) {
      setPwdMessage(
        "La nueva contraseña tiene menos hojas que un cactus: al menos 6 caracteres.",
      )
      return
    }
    if (pwd.next !== pwd.confirm) {
      setPwdMessage("Las contraseñas no coinciden. ¿Olvidaste alguna letra?")
      return
    }
    setPwdMessage("Listo, tu nueva contraseña queda guardada con el resto.")
    setPwd({ current: "", next: "", confirm: "" })
    setEditingPassword(false)
  }

  return (
    <SettingsSection
      icon={<User className="size-5" />}
      title="Mi perfil"
      description="Actualizá tu nombre, mail y contraseña."
    >
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="profile-name">Nombre</FieldLabel>
          <InputGroup>
            <InputGroupAddon>
              <User className="size-4" aria-hidden="true" />
            </InputGroupAddon>
            <InputGroupInput
              id="profile-name"
              type="text"
              autoComplete="name"
              placeholder="Tu nombre"
              value={profile.name}
              onChange={(e) =>
                onChange({ ...profile, name: e.target.value })
              }
            />
          </InputGroup>
        </Field>

        <Field data-invalid={emailError ? "true" : undefined}>
          <FieldLabel htmlFor="profile-email">Correo</FieldLabel>
          <InputGroup>
            <InputGroupAddon>
              <Mail className="size-4" aria-hidden="true" />
            </InputGroupAddon>
            <InputGroupInput
              id="profile-email"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="vos@email.com"
              value={profile.email}
              onChange={(e) =>
                onChange({ ...profile, email: e.target.value })
              }
              aria-invalid={emailError ? true : undefined}
            />
          </InputGroup>
          {emailError ? <FieldError>{emailError}</FieldError> : null}
        </Field>
      </FieldGroup>

      <div className="border-t-2 border-dashed border-border pt-4">
        {!editingPassword ? (
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setEditingPassword(true)
              setPwdMessage(null)
            }}
            className="w-full justify-start gap-2 rounded-2xl border-2 font-semibold"
          >
            <KeyRound className="size-4" aria-hidden="true" />
            Cambiar contraseña
          </Button>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <p className="font-serif text-sm font-semibold">
                Nueva contraseña
              </p>
              <button
                type="button"
                onClick={() => setShowPwd((v) => !v)}
                className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs font-medium"
              >
                {showPwd ? (
                  <>
                    <EyeOff className="size-3.5" aria-hidden="true" /> Ocultar
                  </>
                ) : (
                  <>
                    <Eye className="size-3.5" aria-hidden="true" /> Mostrar
                  </>
                )}
              </button>
            </div>

            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="pwd-current">Contraseña actual</FieldLabel>
                <Input
                  id="pwd-current"
                  type={showPwd ? "text" : "password"}
                  autoComplete="current-password"
                  value={pwd.current}
                  onChange={(e) =>
                    setPwd((p) => ({ ...p, current: e.target.value }))
                  }
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="pwd-next">Nueva contraseña</FieldLabel>
                <Input
                  id="pwd-next"
                  type={showPwd ? "text" : "password"}
                  autoComplete="new-password"
                  value={pwd.next}
                  onChange={(e) =>
                    setPwd((p) => ({ ...p, next: e.target.value }))
                  }
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="pwd-confirm">Repetir nueva</FieldLabel>
                <Input
                  id="pwd-confirm"
                  type={showPwd ? "text" : "password"}
                  autoComplete="new-password"
                  value={pwd.confirm}
                  onChange={(e) =>
                    setPwd((p) => ({ ...p, confirm: e.target.value }))
                  }
                />
              </Field>
            </FieldGroup>

            {pwdMessage ? (
              <p className="text-accent text-xs font-medium">{pwdMessage}</p>
            ) : null}

            <div className="flex gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setEditingPassword(false)
                  setPwd({ current: "", next: "", confirm: "" })
                  setPwdMessage(null)
                }}
                className="flex-1 rounded-2xl"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={applyPasswordChange}
                className="flex-1 rounded-2xl font-semibold"
              >
                Aplicar cambio
              </Button>
            </div>
          </div>
        )}
      </div>
    </SettingsSection>
  )
}
