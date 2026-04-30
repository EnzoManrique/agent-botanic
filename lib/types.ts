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

export interface Plant {
  id: string
  alias: string
  species: string
  scientificName: string
  category: PlantCategory
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
  type: "zonda" | "frost" | "heatwave" | "calm"
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
