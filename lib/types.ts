export type PlantCategory = "interior" | "exterior" | "suculenta" | "comestible"

export interface Plant {
  id: string
  alias: string
  species: string
  scientificName: string
  category: PlantCategory
  imageUrl: string
  wateringFrequencyDays: number
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
