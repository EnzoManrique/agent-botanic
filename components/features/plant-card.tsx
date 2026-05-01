"use client"

import Image from "next/image"
import { Sun, CloudSun, Moon, Leaf } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { LOCATION_META, WATERING_MODE_META } from "@/lib/plant-meta"
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
  const locationMeta = LOCATION_META[plant.location]
  const LocationIcon = locationMeta.icon

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
        {/* Banner compacto: en mobile forzamos h-40 (160px) porque
            aspect-ratio en algunos Safari mobile colapsa la altura a 0
            cuando el contenedor padre no tiene width definido todavía
            durante el hydrate. En pantallas grandes el aspect-ratio
            funciona perfecto y le damos más presencia a la foto. Si no
            hay imagen mostramos un fallback con gradient verde + icono. */}
        <div className="relative h-40 sm:h-auto sm:aspect-[4/3] overflow-hidden bg-gradient-to-br from-primary/15 to-primary/5">
          {plant.imageUrl ? (
            <Image
              src={plant.imageUrl}
              alt={`Foto de ${plant.alias}, una ${plant.species}`}
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              unoptimized={plant.imageUrl.startsWith("data:")}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Leaf
                className="size-10 text-primary/40"
                aria-hidden="true"
              />
            </div>
          )}
          {needsWater ? (
            <span className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold text-accent-foreground shadow-soft">
              <CareIcon className="size-3" aria-hidden="true" />
              <span className="whitespace-nowrap">
                {plant.wateringMode === "soil" ? "Toca regar" : careMeta.actionVerb}
              </span>
            </span>
          ) : null}
          <span className="absolute right-2 bottom-2 inline-flex items-center gap-1 rounded-full bg-card/95 px-2 py-0.5 text-[10px] font-medium text-card-foreground shadow-soft">
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
            <span className="text-border">•</span>
            <div className="inline-flex items-center gap-1">
              <dt className="sr-only">Ubicación</dt>
              <LocationIcon
                className="size-3.5 text-foreground/60"
                aria-hidden="true"
              />
              <dd className="whitespace-nowrap">{locationMeta.shortLabel}</dd>
            </div>
          </dl>
        </div>
      </button>

      <div className="px-4 pb-4">
        {/* El botón queda deshabilitado entre ciclos: una vez registrado el
            cuidado, no se puede volver a tocar hasta que pasen los días de
            frecuencia de la planta. Esto evita registros duplicados ("le di
            agua hoy y volví a tocar" rompía el historial) y comunica visual
            mente cuánto falta para la próxima vez con un texto claro tipo
            "En 6 días". */}
        {(() => {
          const daysUntilNext =
            days === null
              ? 0
              : Math.max(0, plant.wateringFrequencyDays - days)
          const disabled = isPending || !needsWater

          let label: string
          if (isPending) {
            label = "Registrando..."
          } else if (needsWater) {
            label = careMeta.actionVerb
          } else if (daysUntilNext === 1) {
            label = "Mañana"
          } else {
            label = `En ${daysUntilNext} días`
          }

          return (
            <Button
              onClick={(e) => {
                e.stopPropagation()
                onWater(plant.id)
              }}
              disabled={disabled}
              variant={needsWater ? "default" : "secondary"}
              size="sm"
              className="w-full rounded-2xl font-semibold disabled:opacity-100"
              aria-label={
                needsWater
                  ? `${careMeta.actionVerb} ${plant.alias}`
                  : `Próximo cuidado de ${plant.alias} en ${daysUntilNext} ${
                      daysUntilNext === 1 ? "día" : "días"
                    }`
              }
            >
              {isPending ? (
                <Spinner className="size-4" />
              ) : (
                <CareIcon className="size-4" aria-hidden="true" />
              )}
              <span className="truncate">{label}</span>
            </Button>
          )
        })()}
      </div>
    </article>
  )
}
