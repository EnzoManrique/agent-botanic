"use client"

import { useRef, useState, useTransition } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import {
  Camera,
  Sparkles,
  Upload,
  RefreshCw,
  Check,
  Pencil,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldLabel,
  FieldDescription,
  FieldError,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { Badge } from "@/components/ui/badge"
import { identifyPlantAction } from "@/lib/actions/plants"
import type { PlantCategory, PlantIdentification } from "@/lib/types"
import { usePlantManager } from "@/lib/hooks/use-plant-manager"
import { cn } from "@/lib/utils"

type Step = "upload" | "identifying" | "confirm"

const CATEGORY_OPTIONS: { value: PlantCategory; label: string }[] = [
  { value: "interior", label: "Interior" },
  { value: "exterior", label: "Exterior" },
  { value: "suculenta", label: "Suculenta" },
  { value: "comestible", label: "Comestible / Aromática" },
]

const LIGHT_OPTIONS: { value: "alta" | "media" | "baja"; label: string }[] = [
  { value: "baja", label: "Baja (sombra / interior poco iluminado)" },
  { value: "media", label: "Media (luz indirecta)" },
  { value: "alta", label: "Alta (sol directo)" },
]

export function ScannerPanel({
  onRegister,
  onDone,
}: {
  onRegister: ReturnType<typeof usePlantManager>["registerPlant"]
  /** Optional callback after a plant is saved (e.g. navigate to garden). */
  onDone?: () => void
}) {
  const router = useRouter()
  const [step, setStep] = useState<Step>("upload")
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null)
  const [identification, setIdentification] =
    useState<PlantIdentification | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editDraft, setEditDraft] = useState<PlantIdentification | null>(null)
  const [alias, setAlias] = useState("")
  const [aliasError, setAliasError] = useState<string | null>(null)
  const [isSaving, startSaving] = useTransition()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)

  function reset() {
    setStep("upload")
    setImageDataUrl(null)
    setIdentification(null)
    setIsEditing(false)
    setEditDraft(null)
    setAlias("")
    setAliasError(null)
  }

  async function handleFile(file: File) {
    const reader = new FileReader()
    reader.onload = async () => {
      const dataUrl = reader.result as string
      setImageDataUrl(dataUrl)
      setStep("identifying")
      const result = await identifyPlantAction(dataUrl)
      setIdentification(result)
      setStep("confirm")
    }
    reader.readAsDataURL(file)
  }

  function startEditing() {
    if (!identification) return
    setEditDraft({ ...identification })
    setIsEditing(true)
  }

  function cancelEditing() {
    setEditDraft(null)
    setIsEditing(false)
  }

  function applyEditing() {
    if (!editDraft) return
    setIdentification(editDraft)
    setEditDraft(null)
    setIsEditing(false)
  }

  function patchDraft(patch: Partial<PlantIdentification>) {
    setEditDraft((prev) => (prev ? { ...prev, ...patch } : prev))
  }

  function handleSave() {
    if (!alias.trim()) {
      setAliasError("Ponele un alias cariñoso a tu planta.")
      return
    }
    if (!identification) return
    startSaving(async () => {
      await onRegister(alias, identification, imageDataUrl ?? undefined)
      reset()
      if (onDone) {
        onDone()
      } else {
        router.push("/jardin")
      }
    })
  }

  return (
    <div className="flex flex-col gap-5 px-5 pb-6 mt-[25px]">
      {step === "upload" ? (
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="hover:bg-secondary/40 flex flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed border-border bg-card/60 px-6 py-10 text-center transition-colors active:scale-[0.99]"
          >
            <div className="bg-primary text-primary-foreground flex size-16 items-center justify-center rounded-2xl shadow-soft">
              <Camera className="size-7" aria-hidden="true" />
            </div>
            <div>
              <p className="font-serif text-lg font-semibold">Tomar una foto</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Usa la cámara trasera. Buena luz natural ayuda mucho.
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => galleryInputRef.current?.click()}
            className="hover:bg-secondary/40 flex items-center justify-center gap-2 rounded-2xl border-2 border-border bg-card px-4 py-3 text-sm font-semibold transition-colors"
          >
            <Upload className="size-4" aria-hidden="true" />
            Subir desde galería
          </button>

          <div className="rounded-2xl border-2 border-border bg-secondary/40 p-4 text-sm leading-relaxed">
            <p className="font-semibold text-foreground">Tip del agente</p>
            <p className="mt-1 text-muted-foreground">
              Centrá la hoja más característica y evitá el contraluz para que la
              identificación sea más precisa.
            </p>
          </div>
        </div>
      ) : null}

      {step === "identifying" && imageDataUrl ? (
        <div className="space-y-3">
          <div className="relative aspect-square overflow-hidden rounded-3xl border-2 border-border">
            <Image
              src={imageDataUrl || "/placeholder.svg"}
              alt="Foto de la planta a identificar"
              fill
              className="object-cover"
            />
            <div className="bg-background/80 absolute inset-0 flex flex-col items-center justify-center gap-3 backdrop-blur-sm">
              <Spinner className="text-primary size-10" />
              <p className="font-serif text-lg font-semibold">
                Analizando especie...
              </p>
              <p className="text-sm text-muted-foreground">
                Buscando hojas, flores y características.
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {step === "confirm" && identification && imageDataUrl ? (
        <div className="space-y-4">
          <div className="relative aspect-[4/3] overflow-hidden rounded-3xl border-2 border-border">
            <Image
              src={imageDataUrl || "/placeholder.svg"}
              alt="Foto de la planta"
              fill
              className="object-cover"
            />
            <button
              type="button"
              onClick={reset}
              aria-label="Cambiar foto"
              className="bg-background/95 absolute top-3 right-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold shadow-soft transition-colors hover:bg-background"
            >
              <RefreshCw className="size-3.5" aria-hidden="true" />
              Cambiar
            </button>
          </div>

          {/* Identification card */}
          <div className="bg-secondary/60 space-y-3 rounded-3xl border-2 border-border p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <Sparkles
                  className="text-primary size-4 shrink-0"
                  aria-hidden="true"
                />
                <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  Identificación
                </span>
              </div>
              <div className="flex items-center gap-2">
                {!isEditing ? (
                  <Badge variant="secondary" className="shrink-0 rounded-full">
                    {Math.round(identification.confidence * 100)}%
                  </Badge>
                ) : null}
                {!isEditing ? (
                  <button
                    type="button"
                    onClick={startEditing}
                    aria-label="Editar información de la planta"
                    className="bg-card hover:bg-card/80 inline-flex items-center gap-1.5 rounded-full border-2 border-border px-3 py-1 text-xs font-semibold shadow-soft transition-colors"
                  >
                    <Pencil className="size-3.5" aria-hidden="true" />
                    Editar
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={cancelEditing}
                    aria-label="Cancelar edición"
                    className="bg-card hover:bg-card/80 inline-flex size-7 items-center justify-center rounded-full border-2 border-border shadow-soft transition-colors"
                  >
                    <X className="size-3.5" aria-hidden="true" />
                  </button>
                )}
              </div>
            </div>

            {!isEditing ? (
              <>
                <div>
                  <p className="font-serif text-xl font-semibold leading-tight">
                    {identification.species}
                  </p>
                  <p className="text-sm text-muted-foreground italic">
                    {identification.scientificName}
                  </p>
                </div>
                <p className="text-sm leading-relaxed">
                  {identification.description}
                </p>
                <div className="flex flex-wrap gap-1.5 text-xs">
                  <Badge variant="outline" className="rounded-full capitalize">
                    {identification.category}
                  </Badge>
                  <Badge variant="outline" className="rounded-full">
                    Riego cada {identification.wateringFrequencyDays} d
                  </Badge>
                  <Badge variant="outline" className="rounded-full capitalize">
                    Luz {identification.lightNeeds}
                  </Badge>
                </div>
              </>
            ) : editDraft ? (
              <div className="flex flex-col gap-3">
                <Field>
                  <FieldLabel htmlFor="edit-species">
                    Nombre común
                  </FieldLabel>
                  <Input
                    id="edit-species"
                    value={editDraft.species}
                    onChange={(e) => patchDraft({ species: e.target.value })}
                    className="rounded-2xl"
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="edit-scientific">
                    Nombre científico
                  </FieldLabel>
                  <Input
                    id="edit-scientific"
                    value={editDraft.scientificName}
                    onChange={(e) =>
                      patchDraft({ scientificName: e.target.value })
                    }
                    className="rounded-2xl italic"
                    placeholder="Ej: Ocimum basilicum"
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="edit-description">
                    Descripción
                  </FieldLabel>
                  <Textarea
                    id="edit-description"
                    rows={3}
                    value={editDraft.description}
                    onChange={(e) =>
                      patchDraft({ description: e.target.value })
                    }
                    className="rounded-2xl"
                  />
                </Field>

                <div className="grid grid-cols-2 gap-3">
                  <Field>
                    <FieldLabel htmlFor="edit-category">Categoría</FieldLabel>
                    <Select
                      value={editDraft.category}
                      onValueChange={(value) =>
                        patchDraft({ category: value as PlantCategory })
                      }
                    >
                      <SelectTrigger id="edit-category" className="rounded-2xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORY_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="edit-watering">
                      Riego (días)
                    </FieldLabel>
                    <Input
                      id="edit-watering"
                      type="number"
                      min={1}
                      max={60}
                      value={editDraft.wateringFrequencyDays}
                      onChange={(e) =>
                        patchDraft({
                          wateringFrequencyDays: Number(e.target.value) || 1,
                        })
                      }
                      className="rounded-2xl"
                    />
                  </Field>
                </div>

                <Field>
                  <FieldLabel htmlFor="edit-light">Luz que necesita</FieldLabel>
                  <Select
                    value={editDraft.lightNeeds}
                    onValueChange={(value) =>
                      patchDraft({
                        lightNeeds: value as "alta" | "media" | "baja",
                      })
                    }
                  >
                    <SelectTrigger id="edit-light" className="rounded-2xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LIGHT_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>

                <Button
                  type="button"
                  onClick={applyEditing}
                  variant="default"
                  className="w-full rounded-2xl font-semibold shadow-soft"
                >
                  <Check className="size-4" />
                  Aplicar cambios
                </Button>
              </div>
            ) : null}
          </div>

          <Field data-invalid={aliasError ? true : undefined}>
            <FieldLabel htmlFor="plant-alias">Alias cariñoso</FieldLabel>
            <Input
              id="plant-alias"
              placeholder='Ej: "Felipe", "La trepadora del living"'
              value={alias}
              onChange={(e) => {
                setAlias(e.target.value)
                if (aliasError) setAliasError(null)
              }}
              className="rounded-2xl"
              aria-invalid={!!aliasError}
            />
            {aliasError ? (
              <FieldError>{aliasError}</FieldError>
            ) : (
              <FieldDescription>
                Así la vas a reconocer en tu jardín y en el chat con el agente.
              </FieldDescription>
            )}
          </Field>

          <Button
            onClick={handleSave}
            disabled={isSaving || isEditing}
            size="lg"
            className={cn(
              "w-full rounded-2xl font-semibold shadow-soft",
              (isSaving || isEditing) && "opacity-80",
            )}
          >
            {isSaving ? (
              <>
                <Spinner className="size-4" /> Guardando...
              </>
            ) : (
              <>
                <Check className="size-4" />
                Sumar al jardín
              </>
            )}
          </Button>
        </div>
      ) : null}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
        }}
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
        }}
      />
    </div>
  )
}
