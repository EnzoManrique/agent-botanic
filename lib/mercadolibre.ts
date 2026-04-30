import "server-only"

/**
 * Cliente del catálogo público de Mercado Libre Argentina.
 *
 * IMPORTANTE — limitación descubierta a fines de 2025: ML cerró el acceso
 * de apps con sólo Client Credentials a los endpoints que devuelven
 * PRECIOS y VENDEDORES (`/sites/MLA/search`, `/products/{id}/buy_box`).
 * Esos endpoints ahora exigen una app con vínculo comercial aprobado o
 * el flujo Authorization Code con login del vendedor.
 *
 * El único endpoint accesible vía Client Credentials es el catálogo:
 * `/products/search`, que devuelve la FICHA del producto (foto oficial,
 * nombre canónico, marca, modelo) y un `permalink` a la página del
 * producto en mercadolibre.com.ar donde el usuario ve precios en vivo.
 *
 * Para nuestro asistente de jardinería esto sigue siendo valioso: el
 * agente le muestra a la usuaria fichas reales del catálogo de ML con un
 * link directo donde ver los precios actuales.
 *
 * Auth: OAuth 2.0 Client Credentials. Token de 6 hs cacheado en memoria.
 * Docs: https://developers.mercadolibre.com.ar/es_ar/autenticacion-y-autorizacion
 */

const ML_API = "https://api.mercadolibre.com"
const SITE = "MLA"
const TOKEN_SAFETY_MS = 60 * 1000 // pedir token nuevo 1 minuto antes de expirar

// ---------- Tipos públicos ----------

export interface MercadoLibreProduct {
  /** Catalog product id, ej. "MLA22639169". */
  id: string
  /** Nombre canónico del producto en el catálogo. */
  title: string
  /** Marca extraída de attributes (puede ser null si ML no la trae). */
  brand: string | null
  /** Modelo extraído de attributes (puede ser null). */
  model: string | null
  /** URL https de la imagen principal. */
  thumbnail: string
  /** URL pública del producto en mercadolibre.com.ar (donde están los precios en vivo). */
  permalink: string
}

// ---------- Token cache ----------

interface CachedToken {
  accessToken: string
  expiresAt: number // epoch ms
}

let cachedToken: CachedToken | null = null

async function getAccessToken(): Promise<string | null> {
  const clientId = process.env.MERCADOLIBRE_CLIENT_ID
  const clientSecret = process.env.MERCADOLIBRE_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    console.error(
      "[v0] Faltan MERCADOLIBRE_CLIENT_ID / MERCADOLIBRE_CLIENT_SECRET",
    )
    return null
  }

  const now = Date.now()
  if (cachedToken && cachedToken.expiresAt - TOKEN_SAFETY_MS > now) {
    return cachedToken.accessToken
  }

  try {
    const res = await fetch(`${ML_API}/oauth/token`, {
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
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) {
      const text = await res.text().catch(() => "")
      console.error(
        "[v0] ML OAuth respondió",
        res.status,
        text.slice(0, 200),
      )
      return null
    }
    const data = (await res.json()) as {
      access_token?: string
      expires_in?: number
    }
    if (!data.access_token) return null
    // expires_in en segundos (típicamente 21600 = 6h). Default a 5h por las dudas.
    const expiresInMs = (data.expires_in ?? 18000) * 1000
    cachedToken = {
      accessToken: data.access_token,
      expiresAt: now + expiresInMs,
    }
    return data.access_token
  } catch (err) {
    console.error("[v0] Error obteniendo token de ML:", err)
    return null
  }
}

// ---------- Cache de búsquedas ----------

interface SearchCacheEntry {
  at: number
  products: MercadoLibreProduct[]
}

const searchCache = new Map<string, SearchCacheEntry>()
const SEARCH_TTL_MS = 60 * 60 * 1000 // 1h

// ---------- Search ----------

export interface SearchOptions {
  /** Cantidad máxima a devolver. Default 6, max 10. */
  limit?: number
}

export async function searchMercadoLibre(
  query: string,
  opts: SearchOptions = {},
): Promise<MercadoLibreProduct[]> {
  const limit = Math.max(1, Math.min(opts.limit ?? 6, 10))
  const trimmed = query.trim()
  if (!trimmed) return []

  const cacheKey = `${trimmed.toLowerCase()}::${limit}`
  const cached = searchCache.get(cacheKey)
  if (cached && Date.now() - cached.at < SEARCH_TTL_MS) {
    return cached.products
  }

  const token = await getAccessToken()
  if (!token) return []

  // Pedimos un poco más del limit para descartar entradas sin foto.
  const url = new URL(`${ML_API}/products/search`)
  url.searchParams.set("status", "active")
  url.searchParams.set("site_id", SITE)
  url.searchParams.set("q", trimmed)
  url.searchParams.set("limit", String(Math.min(limit + 4, 20)))

  let raw: unknown
  try {
    const res = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) {
      // 401/403 = token inválido. Lo invalidamos para que la próxima
      // request pida uno nuevo.
      if (res.status === 401 || res.status === 403) {
        cachedToken = null
      }
      const text = await res.text().catch(() => "")
      console.error(
        "[v0] ML catalog respondió",
        res.status,
        text.slice(0, 200),
      )
      return []
    }
    raw = await res.json()
  } catch (err) {
    console.error("[v0] Error consultando ML catalog:", err)
    return []
  }

  const results =
    raw && typeof raw === "object" && "results" in raw
      ? ((raw as { results: unknown }).results as unknown[])
      : []

  const normalized = results
    .map(normalizeProduct)
    .filter((p): p is MercadoLibreProduct => p !== null)
    .slice(0, limit)

  searchCache.set(cacheKey, { at: Date.now(), products: normalized })
  return normalized
}

// ---------- Helpers ----------

function normalizeProduct(item: unknown): MercadoLibreProduct | null {
  if (!item || typeof item !== "object") return null
  const r = item as Record<string, unknown>

  const id = typeof r.id === "string" ? r.id : null
  const title = typeof r.name === "string" ? r.name : null
  if (!id || !title) return null

  // pictures es array de { id, url, ...alternativas }. Nos quedamos con la
  // primera URL https.
  const pictures = Array.isArray(r.pictures) ? (r.pictures as unknown[]) : []
  let thumbnail: string | null = null
  for (const p of pictures) {
    if (p && typeof p === "object" && "url" in p) {
      const u = (p as { url?: unknown }).url
      if (typeof u === "string" && u.length > 0) {
        thumbnail = u.replace(/^http:\/\//, "https://")
        break
      }
    }
  }
  // Sin foto, no vale la pena mostrar la card.
  if (!thumbnail) return null

  const attributes = Array.isArray(r.attributes)
    ? (r.attributes as unknown[])
    : []
  const brand = pickAttribute(attributes, ["BRAND", "MARCA"])
  const model = pickAttribute(attributes, ["MODEL", "MODELO"])

  const permalink =
    typeof r.permalink === "string" && r.permalink.length > 0
      ? r.permalink
      : `https://www.mercadolibre.com.ar/p/${id}`

  return {
    id,
    title,
    brand,
    model,
    thumbnail,
    permalink,
  }
}

function pickAttribute(attributes: unknown[], ids: string[]): string | null {
  const lowerIds = ids.map((s) => s.toLowerCase())
  for (const attr of attributes) {
    if (!attr || typeof attr !== "object") continue
    const a = attr as Record<string, unknown>
    const aid = typeof a.id === "string" ? a.id.toLowerCase() : ""
    if (lowerIds.includes(aid)) {
      const v = a.value_name
      if (typeof v === "string" && v.length > 0) return v
    }
  }
  return null
}

/**
 * Util pública conservada del cliente anterior. No la usamos en el flujo
 * actual (el catálogo no devuelve location del seller), pero la dejamos
 * exportada por si reabren los endpoints o agregamos un proveedor
 * alternativo en el futuro.
 */
export function extractStateFromCity(
  city: string | null | undefined,
): string | null {
  if (!city) return null
  const first = city.split(",")[0]?.trim()
  if (!first) return null
  const lower = first.toLowerCase()
  if (lower === "caba" || lower === "capital federal") return "Capital Federal"
  return first
}
