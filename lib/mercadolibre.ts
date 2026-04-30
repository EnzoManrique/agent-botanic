import "server-only"

/**
 * Cliente de la API pública de Mercado Libre Argentina (MLA).
 *
 * No requiere auth para búsquedas de productos. Documentación oficial:
 * https://developers.mercadolibre.com.ar/es_ar/items-y-busquedas
 *
 * Para hackathon: un cache super simple en memoria por query (TTL 1h)
 * para evitar pegarle a la API en cada request del agente y para que
 * dos jueces probando el mismo prompt no hagan double-fetch.
 */

export interface MlProduct {
  id: string
  title: string
  price: number
  currency: string
  thumbnail: string
  permalink: string
  /** Provincia donde está el vendedor (ej "Mendoza", "Buenos Aires"). */
  state: string | null
  /** Ciudad del vendedor si vino. */
  city: string | null
  /** Si el envío es gratis (lo destacamos en la UI). */
  freeShipping: boolean
  /** Cuántas unidades vendidas tiene la publicación: señal de confianza. */
  soldQuantity: number
}

interface CacheEntry {
  ts: number
  data: MlProduct[]
}

const CACHE = new Map<string, CacheEntry>()
const CACHE_TTL_MS = 60 * 60 * 1000 // 1 hora

/**
 * Busca productos en Mercado Libre Argentina y los devuelve normalizados.
 *
 * @param query  Texto de búsqueda libre (ej "fertilizante potus").
 * @param opts.preferredState  Si se pasa, los resultados de esa provincia
 *   se ordenan primero. Útil para priorizar Mendoza para nuestra usuaria.
 * @param opts.limit  Cantidad máxima a devolver (default 6, max 20).
 */
export async function searchMercadoLibre(
  query: string,
  opts: { preferredState?: string | null; limit?: number } = {},
): Promise<MlProduct[]> {
  const limit = Math.min(opts.limit ?? 6, 20)
  const q = query.trim()
  if (!q) return []

  // Cache key incluye el limit porque el server podría pedir más después.
  // El preferred state NO va en la key: el ordenamiento lo hacemos sobre
  // los resultados ya en memoria, no en la URL del fetch.
  const cacheKey = `${q.toLowerCase()}::${limit}`
  const cached = CACHE.get(cacheKey)
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
    return reorderByState(cached.data, opts.preferredState)
  }

  // MLA = Mercado Libre Argentina. Pedimos el doble del limit para tener
  // margen al hacer dedup y filtros, y después recortamos.
  const url =
    `https://api.mercadolibre.com/sites/MLA/search?q=${encodeURIComponent(q)}` +
    `&limit=${Math.min(limit * 2, 20)}` +
    `&condition=new`

  let raw: unknown
  try {
    const res = await fetch(url, {
      // 8s es generoso pero corta en caso de problemas de red para no
      // dejar al chat colgado. La API suele responder en ~300ms.
      signal: AbortSignal.timeout(8000),
      headers: { Accept: "application/json" },
    })
    if (!res.ok) {
      console.error("[v0] Mercado Libre devolvió", res.status)
      return []
    }
    raw = await res.json()
  } catch (error) {
    console.error("[v0] Error consultando Mercado Libre:", error)
    return []
  }

  const products = parseMlResponse(raw).slice(0, limit)
  CACHE.set(cacheKey, { ts: Date.now(), data: products })
  return reorderByState(products, opts.preferredState)
}

/** Normaliza la respuesta cruda de ML a nuestro shape interno. */
function parseMlResponse(raw: unknown): MlProduct[] {
  if (
    !raw ||
    typeof raw !== "object" ||
    !("results" in raw) ||
    !Array.isArray((raw as { results: unknown }).results)
  ) {
    return []
  }
  const results = (raw as { results: unknown[] }).results

  return results
    .map((item): MlProduct | null => {
      if (!item || typeof item !== "object") return null
      const r = item as Record<string, unknown>

      const id = typeof r.id === "string" ? r.id : null
      const title = typeof r.title === "string" ? r.title : null
      const price = typeof r.price === "number" ? r.price : null
      if (!id || !title || price === null) return null

      const address =
        typeof r.address === "object" && r.address !== null
          ? (r.address as Record<string, unknown>)
          : {}
      const shipping =
        typeof r.shipping === "object" && r.shipping !== null
          ? (r.shipping as Record<string, unknown>)
          : {}

      return {
        id,
        title,
        price,
        currency: typeof r.currency_id === "string" ? r.currency_id : "ARS",
        thumbnail:
          typeof r.thumbnail === "string"
            ? // ML manda thumbs como http inseguro a veces; forzamos https.
              r.thumbnail.replace(/^http:\/\//, "https://")
            : "",
        permalink: typeof r.permalink === "string" ? r.permalink : "",
        state:
          typeof address.state_name === "string"
            ? (address.state_name as string)
            : null,
        city:
          typeof address.city_name === "string"
            ? (address.city_name as string)
            : null,
        freeShipping: shipping.free_shipping === true,
        soldQuantity:
          typeof r.sold_quantity === "number"
            ? (r.sold_quantity as number)
            : 0,
      }
    })
    .filter((p): p is MlProduct => p !== null)
}

/**
 * Reordena dejando primero los productos de la provincia preferida.
 * No filtra los que no matchean (porque a veces no hay stock local).
 */
function reorderByState(
  products: MlProduct[],
  preferredState: string | null | undefined,
): MlProduct[] {
  if (!preferredState) return products
  const target = preferredState.toLowerCase()
  return [...products].sort((a, b) => {
    const aMatch = a.state?.toLowerCase() === target ? 0 : 1
    const bMatch = b.state?.toLowerCase() === target ? 0 : 1
    return aMatch - bMatch
  })
}

/**
 * Saca la provincia argentina de un string tipo "Mendoza, Argentina"
 * o "Capital Federal" para usarla en el filtro `preferredState`.
 */
export function extractStateFromCity(city: string | null | undefined): string | null {
  if (!city) return null
  const first = city.split(",")[0]?.trim()
  if (!first) return null
  // Normalizamos "CABA"/"Capital Federal"/"Buenos Aires" al nombre que usa
  // ML en su campo state_name.
  const lower = first.toLowerCase()
  if (lower === "caba" || lower === "capital federal") return "Capital Federal"
  return first
}
