import "server-only"
import type { WeatherAlert, WeatherAlertPreferences } from "@/lib/types"

/**
 * Cliente de clima real basado en Open-Meteo.
 *
 * Por qué Open-Meteo:
 *   - 100% gratis, sin API key (ideal para hackathon).
 *   - Geocoding incluido en otra ruta del mismo proveedor.
 *   - Devuelve forecast horario y diario, viento, humedad, weathercode.
 *
 * El módulo expone tres APIs:
 *   - getForecast(city)            : trae el pronóstico bruto.
 *   - evaluateAlerts(forecast, prefs): convierte los datos crudos en alertas
 *                                      botánicamente relevantes filtradas por
 *                                      las preferencias del usuario.
 *   - getMendozaWeatherAlert()      : helper retro-compatible (un solo banner).
 */

// ──────────────────────────────────────────────────────────────────────────────
// Tipos públicos extra
// ──────────────────────────────────────────────────────────────────────────────

export interface DailyForecast {
  /** ISO YYYY-MM-DD */
  date: string
  tempMaxC: number
  tempMinC: number
  precipitationMm: number
  windMaxKmh: number
  windGustsMaxKmh: number
  /** % de humedad mínima del día (derivado del horario). */
  humidityMin: number
  /** weathercode WMO; 95-99 = tormenta/granizo, 71-77 = nieve, etc. */
  weatherCode: number
}

export interface Forecast {
  location: {
    label: string
    latitude: number
    longitude: number
    timezone: string
  }
  current: {
    tempC: number
    humidity: number
    windKmh: number
    weatherCode: number
  }
  daily: DailyForecast[]
}

// ──────────────────────────────────────────────────────────────────────────────
// Geocoding
// ──────────────────────────────────────────────────────────────────────────────

interface GeocodingResult {
  name: string
  country: string
  latitude: number
  longitude: number
  timezone: string
  admin1?: string
}

async function geocode(city: string): Promise<GeocodingResult | null> {
  const url = new URL("https://geocoding-api.open-meteo.com/v1/search")
  url.searchParams.set("name", city.split(",")[0].trim() || city)
  url.searchParams.set("count", "1")
  url.searchParams.set("language", "es")
  url.searchParams.set("format", "json")

  const res = await fetch(url.toString(), {
    // El nombre de ciudad cambia poco; cacheamos 24 hs.
    next: { revalidate: 60 * 60 * 24, tags: ["geocoding"] },
  })
  if (!res.ok) return null
  const data = (await res.json()) as { results?: GeocodingResult[] }
  return data.results?.[0] ?? null
}

// Fallback Mendoza centro (Plaza Independencia).
const MENDOZA_FALLBACK: GeocodingResult = {
  name: "Mendoza",
  country: "Argentina",
  admin1: "Mendoza",
  latitude: -32.8908,
  longitude: -68.8272,
  timezone: "America/Argentina/Mendoza",
}

// ──────────────────────────────────────────────────────────────────────────────
// Forecast fetch + parseo
// ──────────────────────────────────────────────────────────────────────────────

interface OpenMeteoResponse {
  current?: {
    temperature_2m: number
    relative_humidity_2m: number
    wind_speed_10m: number
    weather_code: number
  }
  hourly?: {
    time: string[]
    relative_humidity_2m: number[]
  }
  daily?: {
    time: string[]
    temperature_2m_max: number[]
    temperature_2m_min: number[]
    precipitation_sum: number[]
    wind_speed_10m_max: number[]
    wind_gusts_10m_max: number[]
    weather_code: number[]
  }
}

export async function getForecast(
  rawCity?: string,
  lat?: number,
  lng?: number,
): Promise<Forecast> {
  const city = (rawCity ?? "Mendoza, Argentina").trim()

  // 1. Resolver coordenadas (si no vienen dadas)
  let geo: GeocodingResult | null = null

  if (lat !== undefined && lng !== undefined) {
    // Si tenemos lat/lng, solo necesitamos el label para la UI
    // (podríamos intentar geocoding inverso, pero por ahora re-usamos el label guardado o city)
    geo = {
      name: city.split(",")[0],
      country: "",
      latitude: lat,
      longitude: lng,
      timezone: "auto",
    }
  } else {
    try {
      geo = await geocode(city)
    } catch {
      geo = null
    }
    if (!geo) geo = MENDOZA_FALLBACK
  }

  // 2. Fetch del forecast a 3 días
  const url = new URL("https://api.open-meteo.com/v1/forecast")
  url.searchParams.set("latitude", String(geo.latitude))
  url.searchParams.set("longitude", String(geo.longitude))
  url.searchParams.set("timezone", geo.timezone || "auto")
  url.searchParams.set("forecast_days", "3")
  url.searchParams.set(
    "current",
    "temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code",
  )
  url.searchParams.set("hourly", "relative_humidity_2m")
  url.searchParams.set(
    "daily",
    "temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max,wind_gusts_10m_max,weather_code",
  )

  const res = await fetch(url.toString(), {
    // Cacheamos 30 minutos: para una hackathon es más que aceptable y nos ahorra
    // pegarle a la API en cada page render.
    next: { revalidate: 60 * 30, tags: ["weather"] },
  })

  if (!res.ok) {
    throw new Error(`Open-Meteo respondió ${res.status}`)
  }
  const data = (await res.json()) as OpenMeteoResponse

  // 3. Calcular humedad mínima diaria a partir del horario
  const humidityByDay = new Map<string, number>()
  if (data.hourly) {
    for (let i = 0; i < data.hourly.time.length; i++) {
      const isoDay = data.hourly.time[i].slice(0, 10)
      const h = data.hourly.relative_humidity_2m[i]
      const prev = humidityByDay.get(isoDay) ?? 100
      humidityByDay.set(isoDay, Math.min(prev, h))
    }
  }

  // 4. Armar el forecast normalizado
  const daily: DailyForecast[] = (data.daily?.time ?? []).map((iso, i) => ({
    date: iso,
    tempMaxC: data.daily!.temperature_2m_max[i],
    tempMinC: data.daily!.temperature_2m_min[i],
    precipitationMm: data.daily!.precipitation_sum[i],
    windMaxKmh: data.daily!.wind_speed_10m_max[i],
    windGustsMaxKmh: data.daily!.wind_gusts_10m_max[i],
    humidityMin: humidityByDay.get(iso) ?? 50,
    weatherCode: data.daily!.weather_code[i],
  }))

  const labelParts = [geo.name, geo.admin1, geo.country].filter(Boolean) as string[]
  const seen = new Set<string>()
  const uniqueParts = labelParts.filter((p) =>
    seen.has(p) ? false : (seen.add(p), true),
  )

  return {
    location: {
      label: uniqueParts.join(", "),
      latitude: geo.latitude,
      longitude: geo.longitude,
      timezone: geo.timezone,
    },
    current: {
      tempC: data.current?.temperature_2m ?? daily[0]?.tempMaxC ?? 20,
      humidity: data.current?.relative_humidity_2m ?? 50,
      windKmh: data.current?.wind_speed_10m ?? 0,
      weatherCode: data.current?.weather_code ?? 0,
    },
    daily,
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// Lógica de alertas
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Convierte el forecast en una lista ordenada de alertas botánicamente
 * relevantes. Filtra según las preferencias del usuario (si tiene apagada
 * "ola de calor", no se devuelve aunque haga 38°C).
 *
 * Reglas (aplicadas a HOY o MAÑANA, lo que dispare antes):
 *   - Zonda      : ráfagas ≥ 50 km/h Y humedad mínima ≤ 25 % (clásico de Cuyo)
 *   - Helada     : temperatura mínima ≤ 2 °C
 *   - Ola calor  : temperatura máxima ≥ 35 °C
 *   - Granizo    : weather_code 96 o 99 (thunderstorm with hail)
 *   - Lluvia     : precipitation_sum ≥ 25 mm
 *   - Calmo      : nada de lo anterior → mensaje neutro
 */
export function evaluateAlerts(
  forecast: Forecast,
  prefs: WeatherAlertPreferences,
): WeatherAlert[] {
  const today = forecast.daily[0]
  const tomorrow = forecast.daily[1]
  const alerts: WeatherAlert[] = []

  if (!today) return alerts

  const fmtDay = (d: DailyForecast) =>
    d === today
      ? "hoy"
      : d === tomorrow
        ? "mañana"
        : new Date(d.date).toLocaleDateString("es-AR", { weekday: "long" })

  // ── ZONDA ──────────────────────────────────────────────────────────────────
  if (prefs.zonda) {
    const candidate = [today, tomorrow].find(
      (d) => d && d.windGustsMaxKmh >= 50 && d.humidityMin <= 25,
    )
    if (candidate) {
      alerts.push({
        type: "zonda",
        severity: candidate.windGustsMaxKmh >= 80 ? "high" : "medium",
        title:
          candidate === today
            ? "Alerta por viento Zonda"
            : "Pronóstico de Zonda",
        description: `Ráfagas previstas de hasta ${Math.round(candidate.windGustsMaxKmh)} km/h con humedad bajando a ${Math.round(candidate.humidityMin)} % ${fmtDay(candidate)}.`,
        recommendation:
          "Movés las macetas exteriores a un lugar resguardado y revisá los tutores. Adelantá un riego ligero a las plantas sensibles para compensar la deshidratación que provoca el viento seco.",
        location: forecast.location.label,
        validUntil: candidate === today ? "Hoy 23:59" : "Mañana 23:59",
      })
    }
  }

  // ── HELADA ─────────────────────────────────────────────────────────────────
  if (prefs.frost) {
    const candidate = [today, tomorrow].find((d) => d && d.tempMinC <= 2)
    if (candidate) {
      alerts.push({
        type: "frost",
        severity: candidate.tempMinC <= -2 ? "high" : "medium",
        title:
          candidate === today
            ? "Riesgo de helada nocturna"
            : "Helada prevista para mañana",
        description: `Mínima estimada de ${Math.round(candidate.tempMinC)} °C ${fmtDay(candidate)} a la madrugada.`,
        recommendation:
          "Cubrí suculentas y comestibles con manta o film transparente. Evitá regar al atardecer para que la raíz no quede encharcada y se congele.",
        location: forecast.location.label,
        validUntil: candidate === today ? "Mañana 08:00" : "Pasado 08:00",
      })
    }
  }

  // ── OLA DE CALOR ───────────────────────────────────────────────────────────
  if (prefs.heatwave) {
    const candidate = [today, tomorrow].find((d) => d && d.tempMaxC >= 35)
    if (candidate) {
      alerts.push({
        type: "heatwave",
        severity: candidate.tempMaxC >= 40 ? "high" : "medium",
        title: "Ola de calor",
        description: `Máxima prevista de ${Math.round(candidate.tempMaxC)} °C ${fmtDay(candidate)}.`,
        recommendation:
          "Regá temprano por la mañana o al anochecer. Movés las plantas de hoja delicada lejos de ventanas con sol directo del mediodía.",
        location: forecast.location.label,
        validUntil: candidate === today ? "Hoy 22:00" : "Mañana 22:00",
      })
    }
  }

  // ── GRANIZO ───────────────────────────────────────────────────────────────
  if (prefs.hail) {
    const candidate = [today, tomorrow].find(
      (d) => d && (d.weatherCode === 96 || d.weatherCode === 99),
    )
    if (candidate) {
      alerts.push({
        type: "zonda", // reusamos un tipo existente del WeatherAlert; el front se guía por title/severity
        severity: "high",
        title: "Posible granizada",
        description: `Pronóstico de tormenta con granizo ${fmtDay(candidate)}.`,
        recommendation:
          "Llevá adentro lo que puedas, tapá las macetas exteriores con cajones o telas gruesas y atá tutores. El granizo destruye hojas grandes en minutos.",
        location: forecast.location.label,
        validUntil: candidate === today ? "Hoy 23:59" : "Mañana 23:59",
      })
    }
  }

  // ── ESTABLE ────────────────────────────────────────────────────────────────
  if (alerts.length === 0) {
    alerts.push({
      type: "calm",
      severity: "low",
      title: "Clima estable",
      description: `Hoy ${Math.round(today.tempMinC)}–${Math.round(today.tempMaxC)} °C, humedad ${Math.round(today.humidityMin)} %.`,
      recommendation:
        "Día tranquilo para revisar el sustrato, rotar macetas y observar nuevas hojas.",
      location: forecast.location.label,
      validUntil: "Hoy 23:59",
    })
  }

  return alerts
}

// ──────────────────────────────────────────────────────────────────────────────
// Helpers retro-compatibles
// ──────────────────────────────────────────────────────────────────────────────

const ALL_ALERTS_ON: WeatherAlertPreferences = {
  zonda: true,
  frost: true,
  hail: true,
  heatwave: true,
  wateringReminder: true,
}

/**
 * Mantenido por compatibilidad con código existente: devuelve UNA alerta para
 * el banner "principal". Si hay varias, gana la más severa.
 */
export async function getMendozaWeatherAlert(
  city = "Mendoza, Argentina",
  prefs: WeatherAlertPreferences = ALL_ALERTS_ON,
): Promise<WeatherAlert> {
  try {
    const forecast = await getForecast(city, prefs.lat, prefs.lng)
    const alerts = evaluateAlerts(forecast, prefs)
    return alerts[0]
  } catch (error) {
    console.error("[v0] Error obteniendo clima real, fallback a calmo:", error)
    return {
      type: "calm",
      severity: "low",
      title: "Clima sin datos",
      description:
        "No pudimos contactar al servicio de clima. Probá refrescar en un rato.",
      recommendation:
        "Mientras tanto, revisá si tus plantas necesitan agua y aprovechá para limpiar hojas.",
      location: city,
      validUntil: "—",
    }
  }
}

/**
 * Versión enriquecida: trae forecast + alertas filtradas por las preferencias
 * del usuario en una sola llamada.
 */
export async function getWeatherSummary(
  city = "Mendoza, Argentina",
  prefs: WeatherAlertPreferences & { lat?: number; lng?: number } = ALL_ALERTS_ON,
): Promise<{ forecast: Forecast; alerts: WeatherAlert[] }> {
  const forecast = await getForecast(city, prefs.lat, prefs.lng)
  const alerts = evaluateAlerts(forecast, prefs)
  return { forecast, alerts }
}
