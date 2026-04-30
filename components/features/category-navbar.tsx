"use client"

import { LayoutGrid, Sprout } from "lucide-react"
import { ALL_CATEGORIES, CATEGORY_META } from "@/lib/plant-meta"
import type { PlantCategory } from "@/lib/types"
import type { GardenFilter } from "./garden-view"
import { cn } from "@/lib/utils"

/**
 * Header del jardín. Lo dejamos `fixed` para que los chips de categoría
 * sigan accesibles cuando la usuaria scrollea las plantas.
 *
 * Antes usábamos `Tabs` de shadcn con `overflow-x-auto`, lo que dejaba la
 * scrollbar nativa visible y unos botones de scroll del WebView que se
 * veían como "wireframe sin terminar". Lo reemplazamos por un scroller
 * propio con `scrollbar-hide` y un par de gradientes laterales que
 * indican que hay más para ver, sin barras feas.
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
  // Armamos la lista una vez para no repetir el mismo JSX dos veces:
  // "Todas" + cada categoría que conozcamos del catálogo central.
  const tabs: Array<{
    id: GardenFilter
    label: string
    icon: typeof LayoutGrid
    count: number
  }> = [
    { id: "all", label: "Todas", icon: LayoutGrid, count: totalPlants },
    ...ALL_CATEGORIES.map((cat) => ({
      id: cat as GardenFilter,
      label: CATEGORY_META[cat].label,
      icon: CATEGORY_META[cat].icon,
      count: groupedByCategory[cat] ?? 0,
    })),
  ]

  return (
    <nav
      aria-label="Filtro de categorías"
      className="fixed left-1/2 -translate-x-1/2 top-[env(safe-area-inset-top)] z-40 w-full max-w-md border-b-2 border-border bg-card/95 shadow-soft backdrop-blur-md"
    >
      {/* Header con el mismo lenguaje visual que ScreenHeader del home:
          icono cuadrado verde a la izquierda, título serif, contador a
          la derecha. Mantiene la coherencia entre pantallas. */}
      <div className="flex items-start gap-3 px-5 pt-6 pb-3">
        <div
          aria-hidden="true"
          className="bg-primary text-primary-foreground flex size-11 shrink-0 items-center justify-center rounded-2xl shadow-soft"
        >
          <Sprout className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="font-serif text-2xl leading-tight font-bold">
            Mi jardín
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {totalPlants}{" "}
            {totalPlants === 1 ? "planta cuidando tu casa" : "plantas cuidando tu casa"}
          </p>
        </div>
      </div>

      {/* Scroller con scrollbar oculta + fades laterales.
          Los gradientes son `pointer-events-none` para no bloquear taps
          en los chips que pasen por debajo. */}
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
          className="flex gap-2 overflow-x-auto scrollbar-hide px-5"
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
                  "inline-flex shrink-0 items-center gap-2 rounded-full border-2 px-3.5 py-2 text-sm font-semibold whitespace-nowrap transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  isActive
                    ? "border-primary bg-primary text-primary-foreground shadow-soft"
                    : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
                )}
              >
                <Icon className="size-4" aria-hidden="true" />
                <span>{label}</span>
                {count > 0 ? (
                  <span
                    className={cn(
                      "ml-0.5 rounded-full px-1.5 text-xs font-bold leading-tight tabular-nums",
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
