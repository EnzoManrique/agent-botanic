export type PlantCategory =
  | "interior"
  | "exterior"
  | "suculenta"
  | "comestible"
  | "floracion"
  | "tropical"
  | "trepadora"
  | "arbol"
  | "acuatica"
  | "hidroponia"
  | "epifita"
  | "bonsai"

/**
 * Modo de cuidado principal:
 * - soil:        en tierra, riego normal cada X días
 * - water:       vive en agua (potus en frasco, lucky bamboo); se CAMBIA el agua
 * - hydroponic:  sistema hidropónico; se renueva la SOLUCIÓN NUTRITIVA
 * - mist:        epífita / aérea (orquídeas, tillandsias); se PULVERIZA
 *
 * El campo `wateringFrequencyDays` se reinterpreta según este modo:
 * cada cuántos días corresponde la acción de cuidado.
 */
export type WateringMode = "soil" | "water" | "hydroponic" | "mist"

/**
 * Ubicación física donde vive la planta. Independiente de la categoría
 * botánica: una Monstera (categoría tropical) puede estar adentro o en un
 * balcón. Esto es lo que mira el agente proactivo para decidir si una
 * alerta climática (Zonda, granizo, helada) le va a llegar a esta planta.
 *
 * - interior: dentro de casa, sin riesgo climático directo.
 * - cubierto: galería, balcón techado, patio cubierto. Le pega viento y
 *   temperatura, pero no granizo ni lluvia directa.
 * - exterior: a la intemperie. Recibe todo.
 * - invernadero: protegido del clima al aire libre.
 */
export type PlantLocation = "interior" | "cubierto" | "exterior" | "invernadero"

export interface Plant {
  id: string
  alias: string
  species: string
  scientificName: string
  category: PlantCategory
  location: PlantLocation
  imageUrl: string
  wateringFrequencyDays: number
  wateringMode: WateringMode
  lightNeeds: "alta" | "media" | "baja"
  createdAt: number
  lastWateredAt: number | null
  notes?: string
}

export interface CareLog {
  id: string
  plantId: string
  type: "water" | "fertilize" | "prune" | "repot"
  timestamp: number
  note?: string
}

export interface AgentTool {
  name: string
  description: string
}

export interface WeatherAlert {
  type: "zonda" | "frost" | "heatwave" | "hail" | "calm"
  severity: "low" | "medium" | "high"
  title: string
  description: string
  recommendation: string
  location: string
  validUntil: string
}

export interface PlantIdentification {
  species: string
  scientificName: string
  category: PlantCategory
  /** Ubicación sugerida según hábitat típico (el usuario la confirma). */
  suggestedLocation: PlantLocation
  wateringFrequencyDays: number
  wateringMode: WateringMode
  lightNeeds: "alta" | "media" | "baja"
  confidence: number
  description: string
}

export type AgentPersonality = "scientist" | "friendly" | "guru"
export type AdviceFrequency = "proactive" | "manual"
export type TempUnit = "celsius" | "fahrenheit"

export interface WeatherAlertPreferences {
  zonda: boolean
  frost: boolean
  hail: boolean
  heatwave: boolean
  wateringReminder: boolean
}

export interface UserSettings {
  profile: {
    name: string
    email: string
  }
  agent: {
    personality: AgentPersonality
    adviceFrequency: AdviceFrequency
  }
  location: {
    city: string
    alerts: WeatherAlertPreferences
    tempUnit: TempUnit
  }
}

export const DEFAULT_USER_SETTINGS: UserSettings = {
  profile: {
    name: "",
    email: "",
  },
  agent: {
    personality: "friendly",
    adviceFrequency: "proactive",
  },
  location: {
    city: "Mendoza, Argentina",
    alerts: {
      zonda: true,
      frost: true,
      hail: true,
      heatwave: false,
      wateringReminder: true,
    },
    tempUnit: "celsius",
  },
}
