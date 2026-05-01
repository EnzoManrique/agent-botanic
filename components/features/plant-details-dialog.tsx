"use client"

import Image from "next/image"
import { useEffect, useState, useTransition } from "react"
import {
  CalendarDays,
  Pencil,
  Trash2,
  X,
  Save,
  Sun,
  CloudSun,
  Moon,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import {
  ALL_CATEGORIES,
  ALL_LOCATIONS,
  CATEGORY_META,
  LOCATION_META,
  WATERING_MODE_META,
} from "@/lib/plant-meta"
import type {
  Plant,
  PlantCategory,
  PlantLocation,
  WateringMode,
} from "@/lib/types"
import type { PlantDetailsPatch } from "@/lib/actions/plants"

const LIGHT_ICONS = { alta: Sun, media: CloudSun, baja: Moon } as const
const LIGHT_LABELS = {
  alta: "Sol pleno",
  media: "Luz indirecta",
  baja: "Sombra",
} as const

const WATERING_MODES: WateringMode[] = ["soil", "water", "hydroponic", "mist"]

function formatDate(timestamp: number | null): string {
  if (!timestamp) return "—"
  return new Date(timestamp).toLocaleDateString("es-AR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

interface Props {
  plant: Plant | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onEdit: (id: string, patch: PlantDetailsPatch) => Promise<{ ok: boolean }>
  onDelete: (id: string) => Promise<{ ok: boolean }>
}

export function PlantDetailsDialog({
  plant,
  open,
  onOpenChange,
  onEdit,
  onDelete,
}: Props) {
  const [mode, setMode] = useState<"view" | "edit">("view")
  const [confirmDelete, setConfirmDelete] = useState(false)

  // Form state — se inicializa cuando entra una planta nueva
  const [alias, setAlias] = useState("")
  const [species, setSpecies] = useState("")
  const [scientificName, setScientificName] = useState("")
  const [category, setCategory] = useState<PlantCategory>("interior")
  const [location, setLocation] = useState<PlantLocation>("interior")
  const [wateringMode, setWateringMode] = useState<WateringMode>("soil")
  const [wateringFrequencyDays, setWateringFrequencyDays] = useState(7)
  const [lightNeeds, setLightNeeds] = useState<Plant["lightNeeds"]>("media")
  const [notes, setNotes] = useState("")

  const [isSaving, startSaving] = useTransition()
  const [isDeleting, startDeleting] = useTransition()

  // Resetea el form cada vez que cambia la planta o se abre el dialog
  useEffect(() => {
    if (!plant) return
    setAlias(plant.alias)
    setSpecies(plant.species)
    setScientificName(plant.scientificName ?? "")
    setCategory(plant.category)
    setLocation(plant.location)
    setWateringMode(plant.wateringMode)
    setWateringFrequencyDays(plant.wateringFrequencyDays)
    setLightNeeds(plant.lightNeeds)
    setNotes(plant.notes ?? "")
    setMode("view")
  }, [plant])

  if (!plant) return null

  const careMeta = WATERING_MODE_META[plant.wateringMode]
  const CareIcon = careMeta.icon
  const LightIcon = LIGHT_ICONS[plant.lightNeeds]
  const categoryMeta = CATEGORY_META[plant.category]
  const CategoryIcon = categoryMeta.icon

  function handleSave() {
    startSaving(async () => {
      const trimmedAlias = alias.trim()
      const trimmedSpecies = species.trim()
      if (!trimmedAlias || !trimmedSpecies) return

      const res = await onEdit(plant!.id, {
        alias: trimmedAlias,
        species: trimmedSpecies,
        scientificName: scientificName.trim(),
        category,
        location,
        wateringMode,
        wateringFrequencyDays,
        lightNeeds,
        notes: notes.trim(),
      })
      if (res.ok) {
        setMode("view")
      }
    })
  }

  function handleDelete() {
    startDeleting(async () => {
      const res = await onDelete(plant!.id)
      if (res.ok) {
        setConfirmDelete(false)
        onOpenChange(false)
      }
    })
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-[92vw] sm:max-w-sm gap-0 overflow-hidden p-0 rounded-3xl">
          {/* Imagen tope con título superpuesto */}
          <div className="relative h-36 sm:h-48 w-full bg-secondary">
            <Image
              src={plant.imageUrl || "/placeholder.svg"}
              alt={`Foto de ${plant.alias}`}
              fill
              sizes="(max-width: 768px) 100vw, 28rem"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
            <DialogHeader className="absolute right-4 bottom-3 left-4 space-y-0 text-left">
              <DialogTitle className="font-serif text-2xl text-white drop-shadow-md">
                {mode === "edit" ? `Editando ${plant.alias}` : plant.alias}
              </DialogTitle>
              <DialogDescription className="text-white/90 drop-shadow">
                {plant.species}
                {plant.scientificName ? ` · ${plant.scientificName}` : ""}
              </DialogDescription>
            </DialogHeader>
          </div>

          {/* Cuerpo scrollable */}
          <div className="max-h-[50vh] overflow-y-auto px-5 py-4">
            {mode === "view" ? (
              <ViewContent
                plant={plant}
                careMeta={careMeta}
                CareIcon={CareIcon}
                LightIcon={LightIcon}
                CategoryIcon={CategoryIcon}
                categoryLabel={categoryMeta.label}
                lightLabel={LIGHT_LABELS[plant.lightNeeds]}
              />
            ) : (
              <EditForm
                alias={alias}
                setAlias={setAlias}
                species={species}
                setSpecies={setSpecies}
                scientificName={scientificName}
                setScientificName={setScientificName}
                category={category}
                setCategory={setCategory}
                location={location}
                setLocation={setLocation}
                wateringMode={wateringMode}
                setWateringMode={setWateringMode}
                wateringFrequencyDays={wateringFrequencyDays}
                setWateringFrequencyDays={setWateringFrequencyDays}
                lightNeeds={lightNeeds}
                setLightNeeds={setLightNeeds}
                notes={notes}
                setNotes={setNotes}
              />
            )}
          </div>

          {/* Acciones inferiores */}
          <div className="flex flex-wrap justify-end gap-2 border-t border-border bg-background px-5 py-3">
            {mode === "view" ? (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => setConfirmDelete(true)}
                  disabled={isDeleting}
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                  Borrar
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setMode("edit")}
                  className="rounded-2xl"
                >
                  <Pencil className="size-4" aria-hidden="true" />
                  Editar
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setMode("view")}
                  disabled={isSaving}
                >
                  <X className="size-4" aria-hidden="true" />
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={isSaving || !alias.trim() || !species.trim()}
                  className="rounded-2xl"
                >
                  {isSaving ? (
                    <>
                      <Spinner className="size-4" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="size-4" aria-hidden="true" />
                      Guardar
                    </>
                  )}
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmación de borrado */}
      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif">
              ¿Borrar {plant.alias}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. La planta y su historial de
              cuidados se eliminarán permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleDelete()
              }}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Spinner className="size-4" />
                  Borrando...
                </>
              ) : (
                <>
                  <Trash2 className="size-4" aria-hidden="true" />
                  Borrar
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

/* ----------------------------- Subcomponentes ----------------------------- */

function ViewContent({
  plant,
  careMeta,
  CareIcon,
  LightIcon,
  CategoryIcon,
  categoryLabel,
  lightLabel,
}: {
  plant: Plant
  careMeta: (typeof WATERING_MODE_META)[WateringMode]
  CareIcon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>
  LightIcon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>
  CategoryIcon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>
  categoryLabel: string
  lightLabel: string
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <InfoTile
          label="Categoría"
          value={categoryLabel}
          Icon={CategoryIcon}
        />
        <InfoTile
          label="Dónde vive"
          value={LOCATION_META[plant.location].label}
          Icon={LOCATION_META[plant.location].icon}
        />
        <InfoTile label="Luz" value={lightLabel} Icon={LightIcon} />
        <InfoTile
          label={careMeta.label}
          value={`Cada ${plant.wateringFrequencyDays} d`}
          Icon={CareIcon}
        />
        <InfoTile
          label="Último cuidado"
          value={formatDate(plant.lastWateredAt)}
          Icon={CalendarDays}
        />
      </div>

      <p className="rounded-2xl bg-secondary/60 px-4 py-3 text-sm text-muted-foreground">
        <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-foreground/70">
          Cómo cuidarla
        </span>
        {careMeta.description}
      </p>

      {plant.notes ? (
        <p className="rounded-2xl border border-border bg-card px-4 py-3 text-sm">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Notas
          </span>
          {plant.notes}
        </p>
      ) : null}

      <p className="text-xs text-muted-foreground">
        En tu jardín desde {formatDate(plant.createdAt)}
      </p>
    </div>
  )
}

function InfoTile({
  label,
  value,
  Icon,
}: {
  label: string
  value: string
  Icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>
}) {
  return (
    <div className="flex items-start gap-2 rounded-2xl border border-border bg-card px-3 py-2">
      <Icon className="mt-0.5 size-4 shrink-0 text-foreground/70" aria-hidden={true} />
      <div className="min-w-0">
        <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </div>
        <div className="truncate text-sm font-semibold">{value}</div>
      </div>
    </div>
  )
}

function EditForm(props: {
  alias: string
  setAlias: (v: string) => void
  species: string
  setSpecies: (v: string) => void
  scientificName: string
  setScientificName: (v: string) => void
  category: PlantCategory
  setCategory: (v: PlantCategory) => void
  location: PlantLocation
  setLocation: (v: PlantLocation) => void
  wateringMode: WateringMode
  setWateringMode: (v: WateringMode) => void
  wateringFrequencyDays: number
  setWateringFrequencyDays: (v: number) => void
  lightNeeds: Plant["lightNeeds"]
  setLightNeeds: (v: Plant["lightNeeds"]) => void
  notes: string
  setNotes: (v: string) => void
}) {
  return (
    <div className="space-y-3">
      <Field label="Apodo">
        <Input
          value={props.alias}
          onChange={(e) => props.setAlias(e.target.value)}
          placeholder="Ej: Felipe"
        />
      </Field>

      <Field label="Especie">
        <Input
          value={props.species}
          onChange={(e) => props.setSpecies(e.target.value)}
          placeholder="Ej: Costilla de Adán"
        />
      </Field>

      <Field label="Nombre científico">
        <Input
          value={props.scientificName}
          onChange={(e) => props.setScientificName(e.target.value)}
          placeholder="Opcional"
        />
      </Field>

      <Field label="Categoría">
        <Select
          value={props.category}
          onValueChange={(v) => props.setCategory(v as PlantCategory)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ALL_CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>
                {CATEGORY_META[c].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <Field label="Dónde la tenés">
        <Select
          value={props.location}
          onValueChange={(v) => props.setLocation(v as PlantLocation)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ALL_LOCATIONS.map((l) => (
              <SelectItem key={l} value={l}>
                {LOCATION_META[l].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="mt-1 text-xs text-muted-foreground">
          {LOCATION_META[props.location].description}
        </p>
      </Field>

      <Field label="Modo de cuidado">
        <Select
          value={props.wateringMode}
          onValueChange={(v) => props.setWateringMode(v as WateringMode)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {WATERING_MODES.map((m) => (
              <SelectItem key={m} value={m}>
                {WATERING_MODE_META[m].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="mt-1 text-xs text-muted-foreground">
          {WATERING_MODE_META[props.wateringMode].description}
        </p>
      </Field>

      <Field
        label={`${WATERING_MODE_META[props.wateringMode].actionVerb} cada (días)`}
      >
        <Input
          type="number"
          min={1}
          max={60}
          value={props.wateringFrequencyDays}
          onChange={(e) => {
            const n = Number(e.target.value)
            if (Number.isFinite(n)) props.setWateringFrequencyDays(n)
          }}
        />
      </Field>

      <Field label="Luz">
        <Select
          value={props.lightNeeds}
          onValueChange={(v) => props.setLightNeeds(v as Plant["lightNeeds"])}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="alta">Sol pleno</SelectItem>
            <SelectItem value="media">Luz indirecta</SelectItem>
            <SelectItem value="baja">Sombra</SelectItem>
          </SelectContent>
        </Select>
      </Field>

      <Field label="Notas">
        <Textarea
          value={props.notes}
          onChange={(e) => props.setNotes(e.target.value)}
          rows={3}
          placeholder="Lo que quieras recordar de esta planta..."
        />
      </Field>
    </div>
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  )
}
