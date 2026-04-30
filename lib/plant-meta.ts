import {
  Sprout,
  Trees,
  Flower2,
  Wheat,
  Flower,
  TreePalm,
  TreePine,
  TreeDeciduous,
  Waves,
  Beaker,
  Feather,
  Leaf,
  Spline,
  Droplets,
  Sparkles,
  Sun,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import type { PlantCategory, WateringMode } from "@/lib/types"

/* -------------------------------------------------------------------------- */
/* Categorías                                                                 */
/* -------------------------------------------------------------------------- */

export interface CategoryMeta {
  label: string
  icon: LucideIcon
  description: string
}

export const CATEGORY_META: Record<PlantCategory, CategoryMeta> = {
  interior: {
    label: "Interior",
    icon: Sprout,
    description: "Plantas de interior y oficina.",
  },
  exterior: {
    label: "Exterior",
    icon: Trees,
    description: "Para jardín, patio o balcón.",
  },
  suculenta: {
    label: "Suculentas",
    icon: Flower2,
    description: "Suculentas y cactus.",
  },
  comestible: {
    label: "Comestibles",
    icon: Wheat,
    description: "Aromáticas, hortalizas y hierbas.",
  },
  floracion: {
    label: "Florales",
    icon: Flower,
    description: "Plantas con flores ornamentales.",
  },
  tropical: {
    label: "Tropicales",
    icon: TreePalm,
    description: "Tropicales y subtropicales.",
  },
  trepadora: {
    label: "Trepadoras",
    icon: Spline,
    description: "Enredaderas y trepadoras.",
  },
  arbol: {
    label: "Árboles",
    icon: TreeDeciduous,
    description: "Árboles y arbustos.",
  },
  acuatica: {
    label: "Acuáticas",
    icon: Waves,
    description: "Crecen en agua o pantanos.",
  },
  hidroponia: {
    label: "Hidropónicas",
    icon: Beaker,
    description: "Cultivo sin tierra, en solución nutritiva.",
  },
  epifita: {
    label: "Epífitas",
    icon: Feather,
    description: "Orquídeas, bromelias, tillandsias.",
  },
  bonsai: {
    label: "Bonsai",
    icon: TreePine,
    description: "Árboles miniatura.",
  },
}

export const ALL_CATEGORIES = Object.keys(CATEGORY_META) as PlantCategory[]

/* -------------------------------------------------------------------------- */
/* Modos de cuidado                                                           */
/* -------------------------------------------------------------------------- */

export interface WateringModeMeta {
  label: string
  icon: LucideIcon
  /** Qué se hace en cada acción de cuidado. */
  actionVerb: string
  /** Label dinámico para el campo numérico. */
  frequencyLabel: string
  /** Descripción corta para tooltips. */
  description: string
  /** Verbo en pasado para el toast tras registrar. */
  actionPast: string
}

export const WATERING_MODE_META: Record<WateringMode, WateringModeMeta> = {
  soil: {
    label: "En tierra (riego normal)",
    icon: Droplets,
    actionVerb: "Regar",
    frequencyLabel: "Regar cada (días)",
    description: "Riego normal sobre la tierra.",
    actionPast: "Regaste",
  },
  water: {
    label: "En agua (cambiar agua)",
    icon: Waves,
    actionVerb: "Cambiar agua",
    frequencyLabel: "Cambiar agua cada (días)",
    description: "Vive en agua. Renová el agua para evitar estancamiento.",
    actionPast: "Cambiaste el agua de",
  },
  hydroponic: {
    label: "Hidropónica (cambiar solución)",
    icon: Beaker,
    actionVerb: "Renovar solución",
    frequencyLabel: "Renovar solución cada (días)",
    description: "Sistema hidropónico. Cambiá la solución nutritiva.",
    actionPast: "Renovaste la solución de",
  },
  mist: {
    label: "Pulverizar (epífitas / aéreas)",
    icon: Sparkles,
    actionVerb: "Pulverizar",
    frequencyLabel: "Pulverizar cada (días)",
    description: "Sin sustrato húmedo. Pulverizá las raíces o follaje.",
    actionPast: "Pulverizaste",
  },
}

export const ALL_WATERING_MODES = Object.keys(
  WATERING_MODE_META,
) as WateringMode[]

/* -------------------------------------------------------------------------- */
/* Light needs                                                                */
/* -------------------------------------------------------------------------- */

export const LIGHT_OPTIONS: {
  value: "alta" | "media" | "baja"
  label: string
  icon: LucideIcon
}[] = [
  { value: "baja", label: "Baja (sombra / poca luz)", icon: Leaf },
  { value: "media", label: "Media (luz indirecta)", icon: Leaf },
  { value: "alta", label: "Alta (sol directo)", icon: Sun },
]
