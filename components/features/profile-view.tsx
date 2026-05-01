"use client"

import { useEffect, useMemo, useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, ChevronRight, Check, Zap } from "lucide-react"
import { toast } from "sonner"
import { ScreenHeader } from "@/components/mobile/screen-header"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { useAuth } from "@/lib/hooks/use-auth"
import { saveSettings } from "@/lib/actions/settings"
import type { UserSettings } from "@/lib/types"
import { ProfileHeaderCard } from "./profile/profile-header-card"
import { MyProfileCard } from "./profile/my-profile-card"
import { AgentSettingsCard } from "./profile/agent-settings-card"
import { WeatherLocationCard } from "./profile/weather-location-card"
import { AccountActions } from "./profile/account-actions"

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

export function ProfileView({
  initialSettings,
}: {
  initialSettings: UserSettings
}) {
  const { user } = useAuth()
  const router = useRouter()
  const [settings, setSettings] = useState<UserSettings>(initialSettings)
  const [pristine, setPristine] = useState<UserSettings>(initialSettings)
  const [isPending, startTransition] = useTransition()

  function handleBack() {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back()
    } else {
      router.push("/")
    }
  }

  // Si el server devolvió defaults vacíos y ya tenemos sesión, prellenamos
  // nombre y mail del usuario logueado para que el form arranque útil.
  useEffect(() => {
    if (!user) return
    setSettings((prev) => {
      if (prev.profile.name && prev.profile.email) return prev
      const next: UserSettings = {
        ...prev,
        profile: {
          name: prev.profile.name || user.name,
          email: prev.profile.email || user.email,
        },
      }
      setPristine(next)
      return next
    })
  }, [user])

  const dirty = useMemo(
    () => JSON.stringify(settings) !== JSON.stringify(pristine),
    [settings, pristine],
  )

  const emailError =
    settings.profile.email.length > 0 && !isValidEmail(settings.profile.email)
      ? "Mmm, ese mail no me cierra. ¿Lo escribiste bien?"
      : undefined

  function handleSave() {
    if (emailError) {
      toast.error(emailError)
      return
    }
    startTransition(async () => {
      const result = await saveSettings(settings)
      if (!result.ok || !result.settings) {
        toast.error(result.error ?? "No pude guardar los cambios.")
        return
      }
      setSettings(result.settings)
      setPristine(result.settings)
      toast.success("Listo, guardamos tus ajustes en el invernadero.")
    })
  }

  function handleReset() {
    setSettings(pristine)
  }

  return (
    <div className="flex flex-col gap-5 mt-[25px]">
      <ScreenHeader
        eyebrow="Configuración"
        title="Ajustes de perfil"
        subtitle="Personalizá tu experiencia de jardinería."
        icon={<ArrowLeft className="size-5" aria-hidden="true" />}
        onIconClick={handleBack}
        iconLabel="Volver"
      />

      <ProfileHeaderCard
        name={settings.profile.name}
        email={settings.profile.email}
      />

      <MyProfileCard
        profile={settings.profile}
        emailError={emailError}
        onChange={(profile) => setSettings((s) => ({ ...s, profile }))}
      />

      <AgentSettingsCard
        agent={settings.agent}
        onChange={(agent) => setSettings((s) => ({ ...s, agent }))}
      />

      <WeatherLocationCard
        location={settings.location}
        onChange={(location) => setSettings((s) => ({ ...s, location }))}
      />

      {/* Entry point al showcase MCP. Lo metemos como card linkeable
          para que se vea destacado pero sin pelear visualmente con las
          cards de configuración real (perfil, agente, clima). */}
      <Link
        href="/perfil/integraciones"
        className="mx-5 flex items-center gap-3 rounded-3xl border-2 border-border bg-card p-4 shadow-soft transition-colors hover:border-primary/40 hover:bg-secondary/40"
      >
        <span
          aria-hidden="true"
          className="bg-primary text-primary-foreground flex size-11 shrink-0 items-center justify-center rounded-2xl shadow-soft"
        >
          <Zap className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-serif text-base font-bold leading-tight">
            Integraciones
          </p>
          <p className="text-xs leading-snug text-muted-foreground text-pretty">
            Conectá Botanic con Claude, Apple Shortcuts y más vía MCP.
          </p>
        </div>
        <ChevronRight
          className="size-5 shrink-0 text-muted-foreground"
          aria-hidden="true"
        />
      </Link>

      <section className="mx-5 flex gap-2">
        <Button
          type="button"
          variant="ghost"
          disabled={!dirty || isPending}
          onClick={handleReset}
          className="rounded-2xl"
        >
          Descartar
        </Button>
        <Button
          type="button"
          onClick={handleSave}
          disabled={!dirty || isPending || Boolean(emailError)}
          className="flex-1 gap-2 rounded-2xl py-6 font-semibold shadow-soft"
        >
          {isPending ? (
            <Spinner className="size-4" />
          ) : (
            <Check className="size-4" aria-hidden="true" />
          )}
          {isPending ? "Guardando..." : "Guardar cambios"}
        </Button>
      </section>

      <AccountActions />
    </div>
  )
}
