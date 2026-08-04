"use client"

import { useEffect, useState } from "react"
import { Bell, Send } from "lucide-react"
import { useLanguage } from "@/lib/i18n/context"
import { usePushNotifications } from "@/lib/hooks/use-push-notifications"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"

export function NotificationsSettingsCard() {
  const { t } = useLanguage()
  const [isIOS, setIsIOS] = useState(false)
  const {
    isSupported,
    isSubscribed,
    loading,
    isSendingTest,
    subscribeToPush,
    unsubscribeFromPush,
    sendTestNotification
  } = usePushNotifications()

  const handleToggle = async (checked: boolean) => {
    if (checked) {
      await subscribeToPush()
    } else {
      await unsubscribeFromPush()
    }
  }

  useEffect(() => {
    if (typeof window !== "undefined") {
      const isApple = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
      setIsIOS(isApple)
    }
  }, [])

  // Si el navegador no soporta Web Push, no mostramos la sección a menos que sea un iPhone
  // en cuyo caso le mostramos un aviso sutil explicándole cómo agregarlo a la pantalla de inicio
  if (!isSupported) {
    if (isIOS) {
      return (
        <section className="mx-5 rounded-3xl border-2 border-border bg-card p-5 shadow-soft animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex items-center gap-3">
            <span
              aria-hidden="true"
              className="bg-primary text-primary-foreground flex size-11 shrink-0 items-center justify-center rounded-2xl shadow-soft"
            >
              <Bell className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <h3 className="font-serif text-lg font-bold leading-tight">
                {t("profile", "notifications_title")}
              </h3>
              <p className="text-xs leading-relaxed text-muted-foreground text-pretty mt-1">
                {t("profile", "notifications_ios_notice")}
              </p>
            </div>
          </div>
        </section>
      )
    }
    return null
  }

  return (
    <section className="mx-5 rounded-3xl border-2 border-border bg-card p-5 shadow-soft animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="mb-4 flex items-center gap-3">
        <span
          aria-hidden="true"
          className="bg-primary text-primary-foreground flex size-11 shrink-0 items-center justify-center rounded-2xl shadow-soft"
        >
          <Bell className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="font-serif text-lg font-bold leading-tight">
            {t("profile", "notifications_title")}
          </h3>
          <p className="text-xs leading-relaxed text-muted-foreground text-pretty">
            {t("profile", "notifications_desc")}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between rounded-xl border border-border p-3 transition-colors hover:bg-secondary/40">
          <Label htmlFor="push-toggle" className="cursor-pointer font-semibold flex-1">
            {t("profile", "notifications_enable")}
          </Label>
          {loading ? (
            <Spinner className="size-5 shrink-0" />
          ) : (
            <Switch
              id="push-toggle"
              checked={isSubscribed}
              onCheckedChange={handleToggle}
              className="shrink-0"
            />
          )}
        </div>

        {isSubscribed && (
          <Button
            type="button"
            variant="outline"
            onClick={sendTestNotification}
            disabled={isSendingTest}
            className="w-full gap-2 rounded-xl py-5 font-semibold shadow-soft hover:bg-secondary/40 border-border transition-all duration-200"
          >
            {isSendingTest ? (
              <Spinner className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" aria-hidden="true" />
            )}
            {t("profile", "notifications_send_test")}
          </Button>
        )}
      </div>
    </section>
  )
}
