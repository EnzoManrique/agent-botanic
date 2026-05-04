"use client"

import { Snowflake, Sun, Wind, Leaf, CloudHail, Sparkles, MessageSquare } from "lucide-react"
import type { WeatherAlert } from "@/lib/types"
import type { ProactiveAdvice } from "@/lib/proactive-advisor"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/lib/i18n/context"

const ICONS: Record<WeatherAlert["type"], React.ElementType> = {
  zonda: Wind,
  frost: Snowflake,
  heatwave: Sun,
  hail: CloudHail,
  calm: Leaf,
}

const STYLES = {
  high: "bg-accent text-accent-foreground border-accent",
  medium: "bg-accent/85 text-accent-foreground border-accent/70",
  low: "bg-secondary text-secondary-foreground border-border",
} as const

interface WeatherBannerProps {
  alert: WeatherAlert
  advice?: ProactiveAdvice | null
}

export function WeatherBanner({ alert, advice }: WeatherBannerProps) {
  const { t } = useLanguage()
  const Icon = ICONS[alert.type]
  const isAlert = alert.severity !== "low"
  
  // Si hay consejo personalizado, usamos el titular del consejo para el banner
  const displayTitle = advice ? advice.headline : alert.title

  return (
    <section
      role="status"
      aria-live="polite"
      className={cn(
        "mx-5 rounded-3xl border-2 px-5 py-4 shadow-soft transition-all duration-500",
        STYLES[alert.severity],
      )}
    >
      {/* Header: Title + Icon */}
      <div className="flex items-start justify-between gap-4 mb-2">
        <p className="font-serif text-lg leading-tight font-bold text-balance flex-1">
          {displayTitle}
        </p>
        <div
          className={cn(
            "flex size-12 shrink-0 items-center justify-center rounded-2xl border-2 transition-transform active:scale-95",
            isAlert
              ? "border-accent-foreground/20 bg-accent-foreground/10"
              : "border-primary/20 bg-primary/10",
          )}
        >
          <Icon className="size-6" aria-hidden="true" />
        </div>
      </div>

      {/* Location badge */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span
          className={cn(
            "inline-block rounded-full border px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase",
            isAlert
              ? "border-accent-foreground/20 bg-accent-foreground/10"
              : "border-foreground/15 bg-foreground/5",
          )}
        >
          {alert.location}
        </span>
        {advice && (
          <span className="flex items-center gap-1.5 rounded-full bg-primary/20 border border-primary/20 px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase text-primary-foreground">
            <Sparkles className="size-3" />
            {t("home", "agent_tip")}
          </span>
        )}
      </div>

      {/* Body content */}
      {advice ? (
        <div className="space-y-3">
          <p className="text-sm leading-relaxed font-medium">
            {advice.message}
          </p>
          <Button
            asChild
            variant="ghost"
            className={cn(
              "w-full justify-start gap-2 h-auto py-3 px-4 rounded-2xl border-2 font-semibold text-xs",
              isAlert
                ? "bg-accent-foreground/10 hover:bg-accent-foreground/20 border-accent-foreground/10"
                : "bg-primary/10 hover:bg-primary/20 border-primary/10"
            )}
          >
            <a href={`/agente?prompt=${encodeURIComponent(advice.chatPrompt)}`}>
              <MessageSquare className="size-4" />
              {t("home", "talk_with_agent")}
            </a>
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-sm leading-relaxed opacity-90">
            {alert.description}
          </p>
          <p className="text-sm leading-relaxed">
            <span className="font-semibold text-xs uppercase tracking-tight opacity-70">{t("home", "recommendation")}: </span>
            {alert.recommendation}
          </p>
        </div>
      )}
      
      <p className="mt-3 text-[10px] font-medium opacity-50 text-right">
        {t("home", "valid_until")} {alert.validUntil}
      </p>
    </section>
  )
}
