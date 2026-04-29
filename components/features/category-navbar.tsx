"use client"

import { Sprout, Trees, Flower2, Wheat } from "lucide-react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { PlantCategory } from "@/lib/types"

const CATEGORY_META: Record<
  PlantCategory,
  { label: string; icon: typeof Sprout }
> = {
  interior: {
    label: "Interior",
    icon: Sprout,
  },
  exterior: {
    label: "Exterior",
    icon: Trees,
  },
  suculenta: {
    label: "Suculentas",
    icon: Flower2,
  },
  comestible: {
    label: "Comestibles",
    icon: Wheat,
  },
}

export function CategoryNavbar({
  groupedByCategory,
  defaultTab,
  onTabChange,
}: {
  groupedByCategory: Record<PlantCategory, number>
  defaultTab: PlantCategory
  onTabChange: (tab: PlantCategory) => void
}) {
  const categories = Object.keys(CATEGORY_META) as PlantCategory[]
  const totalPlants = categories.reduce(
    (sum, cat) => sum + (groupedByCategory[cat] ?? 0),
    0,
  )

  return (
    <nav
      aria-label="Filtro de categorías"
      className="fixed left-1/2 -translate-x-1/2 top-[env(safe-area-inset-top)] z-40 w-full max-w-md border-b-2 border-border bg-card/95 shadow-soft backdrop-blur-md"
    >
      <div className="mx-auto px-5 pt-4 pb-3">
        <div className="mb-3 flex items-baseline justify-between gap-3">
          <h1 className="font-serif text-2xl leading-tight font-bold">
            Mi jardín
          </h1>
          <p className="text-xs font-medium text-muted-foreground">
            {totalPlants} {totalPlants === 1 ? "planta" : "plantas"}
          </p>
        </div>
        <Tabs
          defaultValue={defaultTab}
          onValueChange={(value) => onTabChange(value as PlantCategory)}
          className="w-full"
        >
          <TabsList className="h-auto w-full justify-start gap-2 rounded-2xl bg-transparent p-0 overflow-x-auto scrollbar-hide">
            {categories.map((cat) => {
              const Icon = CATEGORY_META[cat].icon
              const count = groupedByCategory[cat]

              return (
                <TabsTrigger
                  key={cat}
                  value={cat}
                  className="gap-2 rounded-full px-3.5 py-2 text-sm font-semibold whitespace-nowrap transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:text-foreground"
                >
                  <Icon className="size-4" aria-hidden="true" />
                  <span>{CATEGORY_META[cat].label}</span>
                  {count > 0 && (
                    <span className="data-[state=active]:bg-primary-foreground/25 ml-1 rounded-full bg-secondary px-1.5 text-xs font-medium leading-none">
                      {count}
                    </span>
                  )}
                </TabsTrigger>
              )
            })}
          </TabsList>
        </Tabs>
      </div>
    </nav>
  )
}
