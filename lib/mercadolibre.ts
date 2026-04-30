import "server-only"

/**
 * Cliente de la API de Mercado Libre Argentina (MLA) con OAuth.
 *
 * Mercado Libre cerró el acceso anónimo a sus endpoints en 2025: incluso
 * la búsqueda pública (`/sites/MLA/search`) ahora requiere un Bearer token.
 * Usamos Client Credentials grant: la app se autentica como app, sin
 * usuario, y obtiene un token con scope `read` que dura ~6 horas.
 *
 * Docs: https://developers.mercadolibre.com.ar/es_ar/autenticacion-y-autorizacion
 *
 * Cache:
 * - Access token cacheado en memoria hasta 60s antes de su expiración real.
 * - Resultados de búsqueda cacheados 1h por (query + limit) para no pegarle
 *   en cada mensaje del agente y para que dos jueces probando lo mismo no
 *   hagan double-fetch.
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

interface TokenCache {
  accessToken: string
  /** Epoch ms en el que el token deja de ser válido. */
  expiresAt: number
}

let TOKEN_CACHE: TokenCache | null = null

/**
 * Obtiene un access token vía Client Credentials. Cachea hasta 60s antes
 * de la expiración real para evitar usar un token recién vencido. Si las
 * credenciales no están configuradas, devuelve null y el caller decide
 * qué hacer (típicamente: devolver array vacío y loggear).
 */
async function getAccessToken(): Promise<string | null> {
  const clientId = process.env.MERCADOLIBRE_CLIENT_ID
  const clientSecret = process.env.MERCADOLIBRE_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    console.error(
      "[v0] Mercado Libre: faltan MERCADOLIBRE_CLIENT_ID o MERCADOLIBRE_CLIENT_SECRET",
    )
    return null
  }

  // Si tenemos token vigente con margen de 60s, lo devolvemos.
  if (TOKEN_CACHE && TOKEN_CACHE.expiresAt - 60_000 > Date.now()) {
    return TOKEN_CACHE.accessToken
  }

  try {
    const res = await fetch("https://api.mercadolibre.com/oauth/token", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: clientId,
        client_secret: clientSecret,
      }).toString(),
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) {
      const errorBody = await res.text().catch(() => "")
      console.error(
        "[v0] Mercado Libre OAuth devolvió",
        res.status,
        errorBody.slice(0, 200),
      )
      return null
    }
    const data = (await res.json()) as {
      access_token?: string
      expires_in?: number
    }
    if (!data.access_token) {
      console.error("[v0] Mercado Libre OAuth: respuesta sin access_token")
      return null
    }
    // expires_in viene en segundos (típicamente 21600 = 6h). Default a 5h
    // por las dudas si no viene.
    const expiresInMs = (data.expires_in ?? 18000) * 1000
    TOKEN_CACHE = {
      accessToken: data.access_token,
      expiresAt: Date.now() + expiresInMs,
    }
    return data.access_token
  } catch (error) {
    console.error("[v0] Error obteniendo token de Mercado Libre:", error)
    return null
  }
}

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

  const cacheKey = `${q.toLowerCase()}::${limit}`
  const cached = CACHE.get(cacheKey)
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
    return reorderByState(cached.data, opts.preferredState)
  }

  const token = await getAccessToken()
  if (!token) return []

  // Pedimos el doble del limit para tener margen al filtrar/dedupear.
  const url =
    `https://api.mercadolibre.com/sites/MLA/search?q=${encodeURIComponent(q)}` +
    `&limit=${Math.min(limit * 2, 20)}` +
    `&condition=new`

  let raw: unknown
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(8000),
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
    if (!res.ok) {
      // Si el token quedó inválido por algún motivo (rara vez pasa antes
      // del expires_in), invalidamos el cache para que la próxima request
      // pida uno nuevo.
      if (res.status === 401 || res.status === 403) {
        TOKEN_CACHE = null
      }
      const body = await res.text().catch(() => "")
      console.error(
        "[v0] Mercado Libre search devolvió",
        res.status,
        body.slice(0, 200),
      )
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
            ? r.thumbnail.replace(/^http:\/\//, "https://")
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
  const lower = first.toLowerCase()
  if (lower === "caba" || lower === "capital federal") return "Capital Federal"
  return first
}
