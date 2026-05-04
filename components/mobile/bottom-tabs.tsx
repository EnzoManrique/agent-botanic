"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Sprout, Camera, Sparkles } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

// Tipamos explícitamente el array para que `accent` sea un campo opcional
// uniforme en todos los tabs. Sin esto, TS infería tipos distintos por
// elemento (sólo "Escanear" tenía `accent`) y romper en el `tab.accent`.
interface TabConfig {
  href: string
  tKey: string
  icon: LucideIcon
  accent?: boolean
}

const TABS: TabConfig[] = [
  { href: "/", tKey: "home", icon: Home },
  { href: "/jardin", tKey: "garden", icon: Sprout },
  { href: "/escanear", tKey: "scan", icon: Camera, accent: true },
  { href: "/agente", tKey: "agent", icon: Sparkles },
]

import { useLanguage } from "@/lib/i18n/context"

export function BottomTabs() {
  const pathname = usePathname()
  const { t } = useLanguage()

  return (
    <nav
      aria-label="Navegación principal"
      className="fixed inset-x-0 bottom-0 z-40 border-t-2 border-border bg-card/95 px-3 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2 backdrop-blur-md shadow-soft"
    >
      <ul className="mx-auto flex max-w-md items-stretch justify-between gap-1">
        {TABS.map((tab) => {
          const isActive =
            tab.href === "/"
              ? pathname === "/"
              : pathname === tab.href || pathname.startsWith(`${tab.href}/`)
          const Icon = tab.icon

          return (
            <li key={tab.href} className="flex-1">
              <Link
                href={tab.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex min-h-14 w-full flex-col items-center justify-center gap-1 rounded-2xl px-2 py-1.5 text-xs font-semibold transition-colors",
                  isActive
                    ? tab.accent
                      ? "bg-accent text-accent-foreground"
                      : "bg-primary/10 text-primary"
                    : tab.accent
                      ? "text-accent hover:bg-accent/10"
                      : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
                )}
              >
                <Icon
                  className={cn(
                    "size-5 transition-transform",
                    isActive && "scale-110",
                  )}
                  aria-hidden="true"
                  strokeWidth={isActive ? 2.5 : 2}
                />
                <span className="leading-none">{t("nav", tab.tKey)}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
