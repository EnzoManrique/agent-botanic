import { Leaf } from "lucide-react"
import { cn } from "@/lib/utils"

interface ScreenHeaderProps {
  title: string
  subtitle?: string
  eyebrow?: string
  icon?: React.ReactNode
  className?: string
  action?: React.ReactNode
}

export function ScreenHeader({
  title,
  subtitle,
  eyebrow,
  icon,
  className,
  action,
}: ScreenHeaderProps) {
  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-40 mx-auto w-full max-w-md border-b-2 border-border bg-card/95 flex items-start justify-between gap-3 px-5 pt-6 pb-4 shadow-soft backdrop-blur-md",
        className,
      )}
    >
      <div className="flex flex-1 items-start gap-3">
        <div
          className="bg-primary text-primary-foreground flex size-11 shrink-0 items-center justify-center rounded-2xl shadow-soft"
          aria-hidden="true"
        >
          {icon ?? <Leaf className="size-5" />}
        </div>
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
