import { Leaf } from "lucide-react"
import { cn } from "@/lib/utils"

interface ScreenHeaderProps {
  title: string
  subtitle?: string
  eyebrow?: string
  icon?: React.ReactNode
  className?: string
  action?: React.ReactNode
  /**
   * Si está definido, el cuadrado del ícono se renderiza como un botón
   * accesible (útil para convertir el ícono en una flecha de "volver").
   */
  onIconClick?: () => void
  /** Texto accesible para el botón cuando `onIconClick` está definido. */
  iconLabel?: string
}

export function ScreenHeader({
  title,
  subtitle,
  eyebrow,
  icon,
  className,
  action,
  onIconClick,
  iconLabel,
}: ScreenHeaderProps) {
  const iconNode = icon ?? <Leaf className="size-5" />
  const iconClasses =
    "bg-primary text-primary-foreground flex size-11 shrink-0 items-center justify-center rounded-2xl shadow-soft"

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-40 mx-auto w-full max-w-md border-b-2 border-border bg-card/95 flex items-start justify-between gap-3 px-5 pt-6 pb-4 shadow-soft backdrop-blur-md",
        className,
      )}
    >
      <div className="flex flex-1 items-start gap-3">
        {onIconClick ? (
          <button
            type="button"
            onClick={onIconClick}
            aria-label={iconLabel ?? "Volver"}
            className={cn(
              iconClasses,
              "transition-transform hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            )}
          >
            {iconNode}
          </button>
        ) : (
          <div className={iconClasses} aria-hidden="true">
            {iconNode}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="font-serif text-2xl leading-tight font-bold text-balance">
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-0.5 text-sm text-muted-foreground text-pretty">
              {subtitle}
            </p>
          ) : null}
        </div>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  )
}
