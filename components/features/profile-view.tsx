"use client"

import { useEffect, useMemo, useState, useTransition } from "react"
import { Check, Settings } from "lucide-react"
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

const STORAGE_KEY = "sb_user_settings"

function loadFromStorage(): UserSettings | null {
  if (typeof window === "undefined") return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as UserSettings
  } catch {
    return null
  }
}

function saveToStorage(s: UserSettings) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(s))
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

export function ProfileView({
  initialSettings,
}: {
  initialSettings: UserSettings
}) {
  const { user } = useAuth()
  const [settings, setSettings] = useState<UserSettings>(initialSettings)
  const [pristine, setPristine] = useState<UserSettings>(initialSettings)
  const [isPending, startTransition] = useTransition()

  // Hydrate name/email/locally-cached settings once we know the user.
  useEffect(() => {
    const stored = loadFromStorage()
    const next: UserSettings = stored ?? initialSettings
    if (user && (!next.profile.name || !next.profile.email)) {
      next.profile = {
        name: next.profile.name || user.name,
        email: next.profile.email || user.email,
      }
    }
    setSettings(next)
    setPristine(next)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

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
      const result = await saveSettings(settings, user?.id ?? null)
      if (!result.ok || !result.settings) {
        toast.error(result.error ?? "No pude guardar los cambios.")
        return
      }
      saveToStorage(result.settings)
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
        icon={<Settings className="size-5" aria-hidden="true" />}
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


