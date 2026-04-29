"use client"

import Link from "next/link"
import Image from "next/image"
import { Droplets, Leaf, Sparkles, ArrowRight, Camera, Settings } from "lucide-react"
import { usePlantManager } from "@/lib/hooks/use-plant-manager"
import { WeatherBanner } from "./weather-banner"
import { ScreenHeader } from "@/components/mobile/screen-header"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import type { Plant, WeatherAlert } from "@/lib/types"
import { cn } from "@/lib/utils"

export function HomeView({
  initialPlants,
  weather,
}: {
  initialPlants: Plant[]
  weather: WeatherAlert
}) {
  const { plants, needsWatering, waterPlant, isPending } =
    usePlantManager(initialPlants)

  return (
    <div className="flex flex-col gap-5 mt-6">
      <ScreenHeader
        eyebrow="Zero To Agent · Track 2"
        title="Secretary Botanic"
        subtitle="Tu agente de cuidado de plantas"
        action={
          <Link
            href="/perfil"
            aria-label="Ajustes de perfil"
            className="bg-secondary text-secondary-foreground hover:bg-secondary/70 inline-flex size-10 items-center justify-center rounded-2xl border-2 border-border shadow-soft transition-colors"
          >
            <Settings className="size-5" aria-hidden="true" />
          </Link>
        }
      />

      <WeatherBanner alert={weather} />

      <section className="grid grid-cols-2 gap-3 px-5">
        <StatCard
          icon={<Leaf className="size-5" aria-hidden="true" />}
          label="En tu jardín"
          value={plants.length}
          unit={plants.length === 1 ? "planta" : "plantas"}
        />
        <StatCard
          icon={<Droplets className="size-5" aria-hidden="true" />}
          label="Necesitan riego"
          value={needsWatering.length}
          unit={needsWatering.length === 1 ? "planta" : "plantas"}
          accent
        />
      </section>

      <section className="flex flex-col gap-3 px-5">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="font-serif text-xl leading-tight font-semibold">
              Para regar hoy
            </h2>
            <p className="text-xs text-muted-foreground">
              Tocá <strong className="text-foreground">Regar</strong> al
              completarlo.
            </p>
          </div>
          <Link
            href="/jardin"
            className="text-primary inline-flex items-center gap-1 text-xs font-semibold hover:underline"
          >
            Ver jardín
            <ArrowRight className="size-3.5" aria-hidden="true" />
          </Link>
        </div>

        {needsWatering.length === 0 ? (
          <div className="flex items-center gap-3 rounded-3xl border-2 border-border bg-card p-4 shadow-soft">
            <div
              className="bg-primary/10 text-primary flex size-11 shrink-0 items-center justify-center rounded-2xl"
              aria-hidden="true"
            >
              <Sparkles className="size-5" />
            </div>
            <div>
              <p className="font-semibold">¡Todo en orden!</p>
              <p className="text-sm text-muted-foreground">
                No hay riegos pendientes. Disfrutá tu jardín.
              </p>
            </div>
          </div>
        ) : (
          <ul className="flex flex-col gap-2.5">
            {needsWatering.slice(0, 4).map((plant) => (
              <WaterRow
                key={plant.id}
                plant={plant}
                onWater={() => waterPlant(plant.id)}
                isPending={isPending}
              />
            ))}
          </ul>
        )}
      </section>

      <section className="px-5">
        <Link
          href="/escanear"
          className="bg-primary text-primary-foreground flex items-center gap-3 rounded-3xl px-5 py-4 shadow-soft transition-colors hover:bg-primary/90 active:scale-[0.99]"
        >
          <div className="bg-primary-foreground/15 flex size-11 shrink-0 items-center justify-center rounded-2xl">
            <Camera className="size-5" aria-hidden="true" />
          </div>
          <div className="flex-1">
            <p className="font-serif text-lg leading-tight font-semibold">
              Escanear nueva planta
            </p>
            <p className="text-primary-foreground/80 text-xs">
              Identificá especies con IA y sumá al jardín.
            </p>
          </div>
          <ArrowRight className="size-5" aria-hidden="true" />
        </Link>
      </section>
    </div>
  )
}

function WaterRow({
  plant,
  onWater,
  isPending,
}: {
  plant: Plant
  onWater: () => void
  isPending?: boolean
}) {
  const days =
    plant.lastWateredAt === null
      ? null
      : Math.floor(
          (Date.now() - plant.lastWateredAt) / (1000 * 60 * 60 * 24),
        )
  const overdueBy =
    days === null ? null : Math.max(0, days - plant.wateringFrequencyDays)

  return (
    <li className="flex items-center gap-3 rounded-3xl border-2 border-border bg-card p-3 shadow-soft">
      <div className="relative size-14 shrink-0 overflow-hidden rounded-2xl border-2 border-border bg-secondary">
        <Image
          src={plant.imageUrl || "/placeholder.svg"}
          alt={`Foto de ${plant.alias}`}
          fill
          sizes="56px"
          className="object-cover"
        />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-serif text-base leading-tight font-semibold truncate">
          {plant.alias}
        </p>
        <p className="text-xs text-muted-foreground truncate">
          {plant.species}
        </p>
        <p
          className={cn(
            "mt-0.5 text-xs font-semibold",
            overdueBy && overdueBy > 0
              ? "text-accent"
              : "text-muted-foreground",
          )}
        >
          {days === null
            ? "Sin regar todavía"
            : overdueBy && overdueBy > 0
              ? `Atrasada ${overdueBy} ${overdueBy === 1 ? "día" : "días"}`
              : "Toca regar hoy"}
        </p>
      </div>
      <Button
        size="sm"
        onClick={onWater}
        disabled={isPending}
        className="rounded-2xl font-semibold"
        aria-label={`Regar a ${plant.alias}`}
      >
        {isPending ? (
          <Spinner className="size-4" />
        ) : (
          <Droplets className="size-4" aria-hidden="true" />
        )}
        Regar
      </Button>
    </li>
  )
}

function StatCard({
  icon,
  label,
  value,
  unit,
  accent,
}: {
  icon: React.ReactNode
  label: string
  value: string | number
  unit: string
  accent?: boolean
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-3xl border-2 p-4 shadow-soft",
        accent ? "bg-accent/15 border-accent/40" : "bg-card border-border",
      )}
    >
      <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
        <span
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-xl",
            accent
              ? "bg-accent text-accent-foreground"
              : "bg-primary/10 text-primary",
          )}
        >
          {icon}
        </span>
        <span className="truncate">{label}</span>
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="font-serif text-3xl leading-none font-bold tabular-nums">
          {value}
        </span>
        <span className="text-xs text-muted-foreground">{unit}</span>
      </div>
    </div>
  )
}
