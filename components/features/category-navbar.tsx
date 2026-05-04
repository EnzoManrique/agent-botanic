"use client"

import { LayoutGrid, Sprout } from "lucide-react"
import { ALL_CATEGORIES, CATEGORY_META } from "@/lib/plant-meta"
import type { PlantCategory } from "@/lib/types"
import type { GardenFilter } from "./garden-view"
import { cn } from "@/lib/utils"

import { useLanguage } from "@/lib/i18n/context"

/**
 * Header del jardín. `fixed` para que los chips de categoría sigan
 * accesibles cuando la usuaria scrollea las plantas.
 *
 * Diseño: header con ícono + título a la izquierda y contador a la
 * derecha (en lugar de subtítulo debajo) para no robar altura al fixed.
 * Chips flat (sin border ni sombra) para que no se vean "con volumen"
 * y el active state se distingue solo por color de fondo.
 */
export function CategoryNavbar({
  groupedByCategory,
  totalPlants,
  defaultTab,
  onTabChange,
}: {
  groupedByCategory: Record<PlantCategory, number>
  totalPlants: number
  defaultTab: GardenFilter
  onTabChange: (tab: GardenFilter) => void
}) {
  const { t } = useLanguage()
  
  const tabs: Array<{
    id: GardenFilter
    label: string
    icon: typeof LayoutGrid
    count: number
  }> = [
    { id: "all", label: t("garden", "all") || "Todas", icon: LayoutGrid, count: totalPlants },
    ...ALL_CATEGORIES.map((cat) => ({
      id: cat as GardenFilter,
      label: t("garden", cat) || CATEGORY_META[cat].label,
      icon: CATEGORY_META[cat].icon,
      count: groupedByCategory[cat] ?? 0,
    })),
  ]

  return (
    <nav
      aria-label="Filtro de categorías"
      className="fixed left-1/2 -translate-x-1/2 top-[env(safe-area-inset-top)] z-40 w-full max-w-md border-b-2 border-border bg-card/95 shadow-soft backdrop-blur-md"
    >
      <div className="flex items-center gap-3 px-5 pt-5 pb-3">
        <div
          aria-hidden="true"
          className="bg-primary text-primary-foreground flex size-10 shrink-0 items-center justify-center rounded-2xl"
        >
          <Sprout className="size-5" />
        </div>
        <h1 className="font-serif text-2xl leading-tight font-bold flex-1 min-w-0">
          {t("garden", "title") || "Mi jardín"}
        </h1>
        <p className="text-sm font-medium text-muted-foreground whitespace-nowrap tabular-nums">
          {totalPlants} {totalPlants === 1 ? t("home", "plant") || "planta" : t("home", "plants") || "plantas"}
        </p>
      </div>

      {/* Scroller con scrollbar oculta + fades laterales para sugerir
          que hay más chips. Los gradientes son `pointer-events-none`
          para no bloquear taps en los chips que pasen por debajo.
          Inline `style` con `scrollbarWidth` + clase `[&::-webkit-...]`
          como doble seguro: si la utility scrollbar-hide del CSS no
          carga (por caché de Safari) igual queda oculta. */}
      <div className="relative pb-3">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-0 top-0 z-10 h-full w-5 bg-gradient-to-r from-card to-transparent"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute right-0 top-0 z-10 h-full w-5 bg-gradient-to-l from-card to-transparent"
        />
        <div
          role="tablist"
          aria-label="Categorías de plantas"
          className="flex gap-1.5 overflow-x-auto px-5 [&::-webkit-scrollbar]:hidden"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" } as React.CSSProperties}
        >
          {tabs.map(({ id, label, icon: Icon, count }) => {
            const isActive = defaultTab === id
            return (
              <button
                key={id}
                role="tab"
                type="button"
                aria-selected={isActive}
                onClick={() => onTabChange(id)}
                className={cn(
                  "inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "bg-transparent text-muted-foreground hover:bg-secondary/50 hover:text-foreground",
                )}
              >
                <Icon className="size-4" aria-hidden="true" />
                <span>{label}</span>
                {count > 0 ? (
                  <span
                    className={cn(
                      "ml-0.5 rounded-full px-1.5 text-xs font-semibold leading-tight tabular-nums",
                      isActive
                        ? "bg-primary-foreground/20 text-primary-foreground"
                        : "bg-secondary text-secondary-foreground",
                    )}
                  >
                    {count}
                  </span>
                ) : null}
              </button>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
