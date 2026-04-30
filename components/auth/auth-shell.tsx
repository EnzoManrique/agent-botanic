import Link from "next/link"
import { ArrowLeft, Sprout } from "lucide-react"
import { cn } from "@/lib/utils"

interface AuthShellProps {
  /** Big serif headline. */
  title: string
  /** Optional sub-heading rendered under the title. */
  subtitle?: string
  /** Optional back link rendered above the brand mark. */
  back?: { href: string; label?: string }
  /** Form / primary content. */
  children: React.ReactNode
  /** Tertiary content rendered at the bottom (e.g. switch-to-login link). */
  footer?: React.ReactNode
  className?: string
}

export function AuthShell({
  title,
  subtitle,
  back,
  children,
  footer,
  className,
}: AuthShellProps) {
  return (
    <div className={cn("flex flex-1 flex-col", className)}>
      {back ? (
        <Link
          href={back.href}
          className="text-muted-foreground hover:text-foreground -ml-2 mb-4 inline-flex w-fit items-center gap-1.5 rounded-xl px-2 py-1 text-sm font-semibold transition-colors"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          {back.label ?? "Volver"}
        </Link>
      ) : null}

      {/* Header: título + subtítulo a la izquierda, ícono a la derecha.
          El ícono usa ml-auto para pegarse a la derecha, y items-start
          alinea verticalmente el ícono con la primera línea del título. */}
      <div className="mb-8 flex items-start gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="font-serif text-3xl leading-[1.1] font-bold text-balance">
            {title}
          </h1>
          {subtitle ? (
            <p className="text-muted-foreground mt-2 text-sm leading-relaxed text-pretty">
              {subtitle}
            </p>
          ) : null}
        </div>

        <div
          className="bg-primary text-primary-foreground ml-auto mt-0.5 inline-flex size-14 shrink-0 items-center justify-center rounded-2xl shadow-soft"
          aria-hidden="true"
        >
          <Sprout className="size-7" strokeWidth={2.4} />
        </div>
      </div>

      <div className="mt-8 flex flex-1 flex-col">{children}</div>

      {footer ? (
        <div className="mt-8 text-center text-sm font-medium">{footer}</div>
      ) : null}
    </div>
  )
}
