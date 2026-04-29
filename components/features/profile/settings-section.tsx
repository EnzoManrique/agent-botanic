import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface SettingsSectionProps {
  title: string
  description?: string
  icon: ReactNode
  children: ReactNode
  className?: string
}

/**
 * Shared card layout for every settings section so the profile screen
 * keeps a consistent rhythm (icon, title, description, body).
 */
export function SettingsSection({
  title,
  description,
  icon,
  children,
  className,
}: SettingsSectionProps) {
  return (
    <section
      className={cn(
        "mx-5 flex flex-col gap-4 rounded-3xl border-2 border-border bg-card p-5 shadow-soft",
        className,
      )}
    >
      <header className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-2xl"
        >
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="font-serif text-lg leading-tight font-semibold text-balance">
            {title}
          </h3>
          {description ? (
            <p className="mt-0.5 text-xs text-muted-foreground text-pretty">
              {description}
            </p>
          ) : null}
        </div>
      </header>

      <div className="flex flex-col gap-4">{children}</div>
    </section>
  )
}
