"use client"

import Image from "next/image"
import { Droplets, Sun, CloudSun, Moon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import type { Plant } from "@/lib/types"
import { cn } from "@/lib/utils"

const LIGHT_ICONS = {
  alta: Sun,
  media: CloudSun,
  baja: Moon,
} as const

const LIGHT_LABELS = {
  alta: "Sol pleno",
  media: "Luz indirecta",
  baja: "Sombra",
} as const

function daysSince(timestamp: number | null): number | null {
  if (!timestamp) return null
  return Math.floor((Date.now() - timestamp) / (1000 * 60 * 60 * 24))
}

export function PlantCard({
  plant,
  onWater,
  isPending,
}: {
  plant: Plant
  onWater: (id: string) => void
  isPending?: boolean
}) {
  const days = daysSince(plant.lastWateredAt)
  const needsWater = days === null || days >= plant.wateringFrequencyDays
  const LightIcon = LIGHT_ICONS[plant.lightNeeds]

  const wateringStatus =
    days === null
      ? "Sin regar todavía"
      : days === 0
        ? "Regada hoy"
        : days === 1
          ? "Hace 1 día"
          : `Hace ${days} días`

  return (
    <article
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-3xl border-2 bg-card shadow-soft transition-shadow hover:shadow-soft-lg",
        needsWater ? "border-accent/60" : "border-border",
      )}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-secondary">
        <Image
          src={plant.imageUrl || "/placeholder.svg"}
          alt={`Foto de ${plant.alias}, una ${plant.species}`}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {needsWater ? (
          <span className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground shadow-soft">
            <Droplets className="size-3.5" aria-hidden="true" />
            ¡Toca regar!
          </span>
        ) : null}
        <span className="absolute right-3 bottom-3 inline-flex items-center gap-1.5 rounded-full bg-card/95 px-3 py-1 text-xs font-medium text-card-foreground shadow-soft">
          <LightIcon className="size-3.5" aria-hidden="true" />
          {LIGHT_LABELS[plant.lightNeeds]}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <h3 className="font-serif text-xl leading-tight font-semibold text-pretty">
            {plant.alias}
          </h3>
          <p className="text-sm text-muted-foreground italic">
            {plant.species} · <span className="not-italic">{plant.scientificName}</span>
          </p>
        </div>

        <dl className="grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-xl bg-secondary/70 px-3 py-2">
            <dt className="text-muted-foreground">Último riego</dt>
            <dd className="mt-0.5 font-semibold">{wateringStatus}</dd>
          </div>
          <div className="rounded-xl bg-secondary/70 px-3 py-2">
            <dt className="text-muted-foreground">Frecuencia</dt>
            <dd className="mt-0.5 font-semibold">cada {plant.wateringFrequencyDays} d</dd>
          </div>
        </dl>

        <Button
          onClick={() => onWater(plant.id)}
          disabled={isPending}
          variant={needsWater ? "default" : "secondary"}
          className="mt-auto rounded-2xl font-semibold"
          aria-label={`Regar a ${plant.alias}`}
        >
          {isPending ? (
            <>
              <Spinner className="size-4" />
              Registrando...
            </>
          ) : (
            <>
              <Droplets className="size-4" aria-hidden="true" />
              Regar
            </>
          )}
        </Button>
      </div>
    </article>
  )
}
