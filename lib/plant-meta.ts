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
  Home,
  Tent,
  Warehouse,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import type { PlantCategory, PlantLocation, WateringMode } from "@/lib/types"

/* -------------------------------------------------------------------------- */
/* Categorías                                                                 */
/* -------------------------------------------------------------------------- */

export interface CategoryMeta {
  label: string
  label_en: string
  icon: LucideIcon
  description: string
  description_en: string
}

export const CATEGORY_META: Record<PlantCategory, CategoryMeta> = {
  interior: {
    label: "Interior",
    label_en: "Indoor",
    icon: Sprout,
    description: "Plantas de interior y oficina.",
    description_en: "Indoor and office plants.",
  },
  exterior: {
    label: "Exterior",
    label_en: "Outdoor",
    icon: Trees,
    description: "Para jardín, patio o balcón.",
    description_en: "For garden, patio, or balcony.",
  },
  suculenta: {
    label: "Suculentas",
    label_en: "Succulents",
    icon: Flower2,
    description: "Suculentas y cactus.",
    description_en: "Succulents and cacti.",
  },
  comestible: {
    label: "Comestibles",
    label_en: "Edibles",
    icon: Wheat,
    description: "Aromáticas, hortalizas y hierbas.",
    description_en: "Herbs, vegetables, and greens.",
  },
  floracion: {
    label: "Florales",
    label_en: "Flowers",
    icon: Flower,
    description: "Plantas con flores ornamentales.",
    description_en: "Ornamental flowering plants.",
  },
  tropical: {
    label: "Tropicales",
    label_en: "Tropicals",
    icon: TreePalm,
    description: "Tropicales y subtropicales.",
    description_en: "Tropical and subtropical plants.",
  },
  trepadora: {
    label: "Trepadoras",
    label_en: "Vines",
    icon: Spline,
    description: "Enredaderas y trepadoras.",
    description_en: "Vines and climbers.",
  },
  arbol: {
    label: "Árboles",
    label_en: "Trees",
    icon: TreeDeciduous,
    description: "Árboles y arbustos.",
    description_en: "Trees and shrubs.",
  },
  acuatica: {
    label: "Acuáticas",
    label_en: "Aquatics",
    icon: Waves,
    description: "Crecen en agua o pantanos.",
    description_en: "Growing in water or marshes.",
  },
  hidroponia: {
    label: "Hidropónicas",
    label_en: "Hydroponics",
    icon: Beaker,
    description: "Cultivo sin tierra, en solución nutritiva.",
    description_en: "Soilless cultivation in nutrient solution.",
  },
  epifita: {
    label: "Epífitas",
    label_en: "Epiphytes",
    icon: Feather,
    description: "Orquídeas, bromelias, tillandsias.",
    description_en: "Orchids, bromeliads, tillandsias.",
  },
  bonsai: {
    label: "Bonsai",
    label_en: "Bonsai",
    icon: TreePine,
    description: "Árboles miniatura.",
    description_en: "Miniature trees.",
  },
}

export const ALL_CATEGORIES = Object.keys(CATEGORY_META) as PlantCategory[]

/* -------------------------------------------------------------------------- */
/* Modos de cuidado                                                           */
/* -------------------------------------------------------------------------- */

export interface WateringModeMeta {
  label: string
  label_en: string
  icon: LucideIcon
  /** Qué se hace en cada acción de cuidado. */
  actionVerb: string
  actionVerb_en: string
  /** Label dinámico para el campo numérico. */
  frequencyLabel: string
  frequencyLabel_en: string
  /** Descripción corta para tooltips. */
  description: string
  description_en: string
  /** Verbo en pasado para el toast tras registrar. */
  actionPast: string
  actionPast_en: string
}

export const WATERING_MODE_META: Record<WateringMode, WateringModeMeta> = {
  soil: {
    label: "En tierra (riego normal)",
    label_en: "In soil (normal watering)",
    icon: Droplets,
    actionVerb: "Regar",
    actionVerb_en: "Water",
    frequencyLabel: "Regar cada (días)",
    frequencyLabel_en: "Water every (days)",
    description: "Riego normal sobre la tierra.",
    description_en: "Normal watering on soil.",
    actionPast: "Regaste",
    actionPast_en: "You watered",
  },
  water: {
    label: "En agua (cambiar agua)",
    label_en: "In water (change water)",
    icon: Waves,
    actionVerb: "Cambiar agua",
    actionVerb_en: "Change water",
    frequencyLabel: "Cambiar agua cada (días)",
    frequencyLabel_en: "Change water every (days)",
    description: "Vive en agua. Renová el agua para evitar estancamiento.",
    description_en: "Lives in water. Renew water to avoid stagnation.",
    actionPast: "Cambiaste el agua de",
    actionPast_en: "You changed the water for",
  },
  hydroponic: {
    label: "Hidropónica (cambiar solución)",
    label_en: "Hydroponic (change solution)",
    icon: Beaker,
    actionVerb: "Renovar solución",
    actionVerb_en: "Renew solution",
    frequencyLabel: "Renovar solución cada (días)",
    frequencyLabel_en: "Renew solution every (days)",
    description: "Sistema hidropónico. Cambiá la solución nutritiva.",
    description_en: "Hydroponic system. Change the nutrient solution.",
    actionPast: "Renovaste la solución de",
    actionPast_en: "You renewed the solution for",
  },
  mist: {
    label: "Pulverizar (epífitas / aéreas)",
    label_en: "Mist (epiphytes / air plants)",
    icon: Sparkles,
    actionVerb: "Pulverizar",
    actionVerb_en: "Mist",
    frequencyLabel: "Pulverizar cada (días)",
    frequencyLabel_en: "Mist every (days)",
    description: "Sin sustrato húmedo. Pulverizá las raíces o follaje.",
    description_en: "Without moist substrate. Mist roots or foliage.",
    actionPast: "Pulverizaste",
    actionPast_en: "You misted",
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

/* -------------------------------------------------------------------------- */
/* Ubicación física (importa para alertas climáticas)                          */
/* -------------------------------------------------------------------------- */

export interface LocationMeta {
  label: string
  label_en: string
  shortLabel: string
  shortLabel_en: string
  icon: LucideIcon
  description: string
  description_en: string
  /** Si recibe granizo, lluvia y viento directos */
  isExposed: boolean
  /** Si recibe temperatura/viento (aún si está techado) */
  feelsWeather: boolean
}

export const LOCATION_META: Record<PlantLocation, LocationMeta> = {
  interior: {
    label: "Interior",
    label_en: "Indoor",
    shortLabel: "Adentro",
    shortLabel_en: "Indoor",
    icon: Home,
    description: "Adentro de tu casa. No le pega clima.",
    description_en: "Inside your house. Not affected by weather.",
    isExposed: false,
    feelsWeather: false,
  },
  cubierto: {
    label: "Cubierto",
    label_en: "Covered",
    shortLabel: "Cubierto",
    shortLabel_en: "Covered",
    icon: Tent,
    description: "Galería, balcón techado, patio cubierto. Le pega viento y temperatura, no granizo.",
    description_en: "Gallery, covered balcony, or porch. Exposed to wind and temperature, but not hail.",
    isExposed: false,
    feelsWeather: true,
  },
  exterior: {
    label: "Exterior",
    label_en: "Outdoor",
    shortLabel: "Afuera",
    shortLabel_en: "Outdoor",
    icon: Sun,
    description: "A la intemperie. Recibe sol, viento, granizo y lluvia.",
    description_en: "In the open air. Exposed to sun, wind, hail, and rain.",
    isExposed: true,
    feelsWeather: true,
  },
  invernadero: {
    label: "Invernadero",
    label_en: "Greenhouse",
    shortLabel: "Invernadero",
    shortLabel_en: "Greenhouse",
    icon: Warehouse,
    description: "Protegida del clima al aire libre.",
    description_en: "Protected from the elements while still being outdoors.",
    isExposed: false,
    feelsWeather: false,
  },
}

export const ALL_LOCATIONS = Object.keys(LOCATION_META) as PlantLocation[]
