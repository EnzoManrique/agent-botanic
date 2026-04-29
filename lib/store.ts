import type { Plant, CareLog } from "./types"

/**
 * In-memory store for the hackathon prototype.
 * In production this would be replaced by Supabase/Neon/etc.
 *
 * We attach to globalThis so it survives Next.js dev hot-reloads.
 */
type StoreShape = {
  plants: Plant[]
  logs: CareLog[]
}

const globalForStore = globalThis as unknown as { __botanicStore?: StoreShape }

const seedPlants: Plant[] = [
  {
    id: "p_monstera",
    alias: "Felipe",
    species: "Costilla de Adán",
    scientificName: "Monstera deliciosa",
    category: "interior",
    imageUrl: "/plants/monstera.jpg",
    wateringFrequencyDays: 7,
    lightNeeds: "media",
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 30,
    lastWateredAt: Date.now() - 1000 * 60 * 60 * 24 * 8,
    notes: "Le encanta la luz indirecta del living.",
  },
  {
    id: "p_pothos",
    alias: "Greta",
    species: "Potus",
    scientificName: "Epipremnum aureum",
    category: "interior",
    imageUrl: "/plants/pothos.jpg",
    wateringFrequencyDays: 5,
    lightNeeds: "baja",
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 60,
    lastWateredAt: Date.now() - 1000 * 60 * 60 * 24 * 3,
  },
  {
    id: "p_cactus",
    alias: "Pancho",
    species: "Cactus barril",
    scientificName: "Echinocactus grusonii",
    category: "suculenta",
    imageUrl: "/plants/cactus.jpg",
    wateringFrequencyDays: 21,
    lightNeeds: "alta",
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 90,
    lastWateredAt: Date.now() - 1000 * 60 * 60 * 24 * 14,
  },
  {
    id: "p_aloe",
    alias: "Lola",
    species: "Aloe vera",
    scientificName: "Aloe barbadensis miller",
    category: "suculenta",
    imageUrl: "/plants/aloe.jpg",
    wateringFrequencyDays: 14,
    lightNeeds: "alta",
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 45,
    lastWateredAt: Date.now() - 1000 * 60 * 60 * 24 * 16,
  },
  {
    id: "p_basil",
    alias: "Albahaca",
    species: "Albahaca",
    scientificName: "Ocimum basilicum",
    category: "comestible",
    imageUrl: "/plants/basil.jpg",
    wateringFrequencyDays: 2,
    lightNeeds: "alta",
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 14,
    lastWateredAt: Date.now() - 1000 * 60 * 60 * 24 * 1,
  },
]

function getStore(): StoreShape {
  if (!globalForStore.__botanicStore) {
    globalForStore.__botanicStore = {
      plants: [...seedPlants],
      logs: [],
    }
  }
  return globalForStore.__botanicStore
}

export function getAllPlants(): Plant[] {
  return [...getStore().plants].sort((a, b) => b.createdAt - a.createdAt)
}

export function getPlantById(id: string): Plant | undefined {
  return getStore().plants.find((p) => p.id === id)
}

export function addPlant(plant: Plant): void {
  getStore().plants.unshift(plant)
}

export function updatePlant(id: string, patch: Partial<Plant>): Plant | undefined {
  const store = getStore()
  const idx = store.plants.findIndex((p) => p.id === id)
  if (idx === -1) return undefined
  store.plants[idx] = { ...store.plants[idx], ...patch }
  return store.plants[idx]
}

export function addLog(log: CareLog): void {
  getStore().logs.unshift(log)
}

export function getLogsForPlant(plantId: string): CareLog[] {
  return getStore().logs.filter((l) => l.plantId === plantId)
}
