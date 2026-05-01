import { Snowflake, Sun, Wind, Leaf, CloudHail } from "lucide-react"
import type { WeatherAlert } from "@/lib/types"
import { cn } from "@/lib/utils"

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

export function WeatherBanner({ alert }: { alert: WeatherAlert }) {
  const Icon = ICONS[alert.type]
  const isAlert = alert.severity !== "low"

  return (
    <section
      role="status"
      aria-live="polite"
      className={cn(
        "mx-5 rounded-3xl border-2 px-5 py-4 shadow-soft",
        STYLES[alert.severity],
      )}
    >
      {/* Header: Title + Icon */}
      <div className="flex items-start justify-between gap-4 mb-2">
        <p className="font-serif text-lg leading-tight font-semibold text-balance flex-1">
          {alert.title}
        </p>
        {/* Icon on the right */}
        <div
          className={cn(
            "flex size-12 shrink-0 items-center justify-center rounded-2xl border-2",
            isAlert
              ? "border-accent-foreground/20 bg-accent-foreground/10"
              : "border-primary/20 bg-primary/10",
          )}
        >
          <Icon className="size-6" aria-hidden="true" />
        </div>
      </div>

      {/* Location badge */}
      <span
        className={cn(
          "inline-block rounded-full border px-2.5 py-0.5 text-xs font-semibold tracking-wide uppercase mb-3",
          isAlert
            ? "border-accent-foreground/20 bg-accent-foreground/10"
            : "border-foreground/15 bg-foreground/5",
        )}
      >
        {alert.location}
      </span>

      {/* Body content */}
      <p className="text-sm leading-relaxed opacity-90 mb-2">
        {alert.description}
      </p>
      <p className="text-sm leading-relaxed">
        <span className="font-semibold">Recomendación: </span>
        {alert.recommendation}
      </p>
      <p className="mt-2 text-xs opacity-70">Vigente hasta {alert.validUntil}</p>
    </section>
  )
}
