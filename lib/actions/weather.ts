"use server"

export interface SearchResult {
  id: number
  name: string
  latitude: number
  longitude: number
  country: string
  admin1?: string
}

export async function searchLocationsAction(query: string): Promise<SearchResult[]> {
  if (!query || query.length < 3) return []

  try {
    const url = new URL("https://geocoding-api.open-meteo.com/v1/search")
    url.searchParams.set("name", query)
    url.searchParams.set("count", "10")
    url.searchParams.set("language", "es")
    url.searchParams.set("format", "json")

    const res = await fetch(url.toString())
    if (!res.ok) return []
    
    const data = await res.json() as { results?: SearchResult[] }
    return data.results || []
  } catch (error) {
    console.error("[searchLocationsAction] Error:", error)
    return []
  }
}
