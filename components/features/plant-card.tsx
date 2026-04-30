"use client"

import Image from "next/image"
import { Sun, CloudSun, Moon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { WATERING_MODE_META } from "@/lib/plant-meta"
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
  onOpen,
  isPending,
}: {
  plant: Plant
  onWater: (id: string) => void
  onOpen: (plant: Plant) => void
  isPending?: boolean
}) {
  const days = daysSince(plant.lastWateredAt)
  const needsWater = days === null || days >= plant.wateringFrequencyDays
  const LightIcon = LIGHT_ICONS[plant.lightNeeds]
  const careMeta = WATERING_MODE_META[plant.wateringMode]
  const CareIcon = careMeta.icon

  const wateringStatus =
    days === null
      ? "Sin cuidado"
      : days === 0
        ? "Hoy"
        : days === 1
          ? "Hace 1 día"
          : `Hace ${days} d`

  return (
    <article
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-3xl border-2 bg-card shadow-soft transition-shadow hover:shadow-soft-lg",
        needsWater ? "border-accent/60" : "border-border",
      )}
    >
      {/* Toda la zona de info es un botón que abre el detalle */}
      <button
        type="button"
        onClick={() => onOpen(plant)}
        className="flex flex-1 flex-col text-left rounded-3xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        aria-label={`Ver detalles de ${plant.alias}`}
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
            <span className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-1 text-[11px] font-semibold text-accent-foreground shadow-soft">
              <CareIcon className="size-3" aria-hidden="true" />
              <span className="whitespace-nowrap">
                {plant.wateringMode === "soil" ? "Toca regar" : careMeta.actionVerb}
              </span>
            </span>
          ) : null}
          <span className="absolute right-3 bottom-3 inline-flex items-center gap-1 rounded-full bg-card/95 px-2.5 py-1 text-[11px] font-medium text-card-foreground shadow-soft">
            <LightIcon className="size-3" aria-hidden="true" />
            <span className="whitespace-nowrap">{LIGHT_LABELS[plant.lightNeeds]}</span>
          </span>
        </div>

        <div className="flex flex-1 flex-col gap-2 p-4">
          <div className="min-w-0">
            <h3 className="truncate font-serif text-xl leading-tight font-semibold">
              {plant.alias}
            </h3>
            <p className="truncate text-sm text-muted-foreground italic">
              {plant.species}
              {plant.scientificName ? (
                <span className="not-italic"> · {plant.scientificName}</span>
              ) : null}
            </p>
          </div>

          {/* Stats en flex-row con whitespace-nowrap: nunca se rompen en columnas finitas */}
          <dl className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <div className="inline-flex items-center gap-1">
              <dt className="sr-only">Último cuidado</dt>
              <CareIcon className="size-3.5 text-foreground/60" aria-hidden="true" />
              <dd className="font-medium text-foreground whitespace-nowrap">
                {wateringStatus}
              </dd>
            </div>
            <span className="text-border">•</span>
            <div className="inline-flex items-center gap-1">
              <dt className="sr-only">Frecuencia</dt>
              <dd className="whitespace-nowrap">
                cada {plant.wateringFrequencyDays} d
              </dd>
            </div>
          </dl>
        </div>
      </button>

      <div className="px-4 pb-4">
        <Button
          onClick={(e) => {
            e.stopPropagation()
            onWater(plant.id)
          }}
          disabled={isPending}
          variant={needsWater ? "default" : "secondary"}
          size="sm"
          className="w-full rounded-2xl font-semibold"
          aria-label={`${careMeta.actionVerb} ${plant.alias}`}
        >
          {isPending ? (
            <>
              <Spinner className="size-4" />
              <span className="truncate">Registrando...</span>
            </>
          ) : (
            <>
              <CareIcon className="size-4" aria-hidden="true" />
              <span className="truncate">{careMeta.actionVerb}</span>
            </>
          )}
        </Button>
      </div>
    </article>
  )
}
