import { NextRequest } from "next/server"
import { resolveMcpToken } from "@/lib/db/mcp-tokens"
import { getAllPlants } from "@/lib/db/plants"
import { getUserSettings } from "@/lib/db/settings"
import { evaluateAlerts, getForecast } from "@/lib/weather"

/**
 * Endpoint optimizado para Apple Shortcuts / Siri.
 *
 * Devuelve TEXTO PLANO (Content-Type: text/plain) en español, redactado
 * para que Siri lo lea en voz alta tal cual. Eso permite que el atajo
 * tenga sólo dos pasos:
 *   1. "Obtener contenido de URL" con el header Authorization
 *   2. "Hablar texto" con el resultado anterior
 *
 * Sin diccionarios, sin JSON Path, sin pasos intermedios. Lo más usable
 * para alguien que jamás vio JSON en su vida.
 *
 * Comandos disponibles vía `?q=`:
 *   - watering  → qué plantas hay que regar hoy
 *   - plants    → resumen del jardín
 *   - weather   → estado del clima + alertas activas
 *   - (vacío)   → ayuda con los comandos disponibles
 */

export const maxDuration = 30

export async function GET(req: NextRequest) {
  // Auth por header — el atajo de Shortcuts pone el token en Authorization.
  const header = req.headers.get("authorization") || ""
  const match = header.match(/^Bearer\s+(.+)$/i)
  if (!match) {
    return textResponse(
      "No pude verificar tu identidad. Asegurate de pegar el token de Botanic en el atajo.",
      401,
    )
  }

  const resolved = await resolveMcpToken(match[1].trim())
  if (!resolved) {
    return textResponse(
      "Tu token de Botanic no es válido. Generá uno nuevo en la app y volvé a intentarlo.",
      401,
    )
  }

  const userEmail = resolved.userEmail
  const url = new URL(req.url)
  const command = (url.searchParams.get("q") || "").toLowerCase().trim()

  try {
    switch (command) {
      case "watering":
      case "regar":
      case "riego":
        return textResponse(await sayWateringToday(userEmail), 200)

      case "plants":
      case "plantas":
      case "jardin":
        return textResponse(await sayGardenSummary(userEmail), 200)

      case "weather":
      case "clima":
      case "tiempo":
        return textResponse(await sayWeather(userEmail), 200)

      case "":
        return textResponse(
          "Hola, soy Botanic. Probá decirle a Siri: mis plantas, qué riego hoy, o cómo está el clima.",
          200,
        )

      default:
        return textResponse(
          `No reconozco el comando "${command}". Probá con: regar, plantas o clima.`,
          400,
        )
    }
  } catch (err) {
    console.error("[v0] Voice endpoint error:", err)
    return textResponse(
      "Hubo un problema consultando tu jardín. Probá de nuevo en un ratito.",
      500,
    )
  }
}

// ---------- Generadores de texto ----------

async function sayWateringToday(userEmail: string): Promise<string> {
  const plants = await getAllPlants(userEmail)
  const now = Date.now()

  const needWater = plants.filter((p) => {
    if (!p.lastWateredAt) return true
    const days = Math.floor((now - p.lastWateredAt) / (1000 * 60 * 60 * 24))
    return days >= p.wateringFrequencyDays
  })

  if (plants.length === 0) {
    return "Todavía no tenés plantas cargadas en tu jardín. Agregá la primera desde la app."
  }
  if (needWater.length === 0) {
    return "Hoy no necesitás regar nada, tu jardín está al día. Buen trabajo."
  }
  if (needWater.length === 1) {
    return `Hoy te toca regar a ${needWater[0].alias}. Es ${needWater[0].species}.`
  }

  const lista = formatList(needWater.map((p) => p.alias))
  return `Hoy te toca regar ${needWater.length} plantas: ${lista}. Acordate de revisar el sustrato antes.`
}

async function sayGardenSummary(userEmail: string): Promise<string> {
  const plants = await getAllPlants(userEmail)
  if (plants.length === 0) {
    return "Tu jardín está vacío. Agregá tu primera planta desde la app de Botanic."
  }
  if (plants.length === 1) {
    const p = plants[0]
    return `Tenés una sola planta: ${p.alias}, ${p.species}. Está en ${p.location}.`
  }
  const aliases = formatList(plants.map((p) => p.alias))
  return `Tenés ${plants.length} plantas en tu jardín: ${aliases}.`
}

async function sayWeather(userEmail: string): Promise<string> {
  const settings = await getUserSettings(userEmail)
  const city = settings.location.city || "Mendoza, Argentina"
  const forecast = await getForecast(city)
  const alerts = evaluateAlerts(forecast, settings.location.alerts)

  const temp = Math.round(forecast.current.tempC)
  const wind = Math.round(forecast.current.windKmh)
  const cityShort = forecast.location.label.split(",")[0]

  if (alerts.length === 0) {
    return `En ${cityShort} el clima está estable. Hay ${temp} grados y viento de ${wind} kilómetros por hora. No hay alertas activas para tus plantas.`
  }

  const alertText = alerts
    .map((a) => a.title.toLowerCase())
    .slice(0, 2)
    .join(" y ")
  return `En ${cityShort} hay ${temp} grados. Atención: detecté ${alertText}. Revisá tus plantas más sensibles.`
}

// ---------- Helpers ----------

/** Une elementos en un string natural ("a, b y c"). */
function formatList(items: string[]): string {
  if (items.length === 0) return ""
  if (items.length === 1) return items[0]
  if (items.length === 2) return `${items[0]} y ${items[1]}`
  return `${items.slice(0, -1).join(", ")} y ${items[items.length - 1]}`
}

function textResponse(text: string, status: number): Response {
  return new Response(text, {
    status,
    headers: {
      // text/plain con charset UTF-8 — Apple Shortcuts lo lee directo.
      "Content-Type": "text/plain; charset=utf-8",
      // CORS por las dudas que alguien lo pruebe desde browser.
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Authorization",
      // Sin caché — los datos del jardín cambian.
      "Cache-Control": "no-store",
    },
  })
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Authorization",
      "Access-Control-Max-Age": "86400",
    },
  })
}
