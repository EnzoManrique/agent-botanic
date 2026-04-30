import { convertToModelMessages, streamText, tool, stepCountIs, type UIMessage } from "ai"
import { z } from "zod"
import { auth } from "@/auth"
import { getAllPlants } from "@/lib/db/plants"
import { getUserSettings } from "@/lib/db/settings"
import { evaluateAlerts, getForecast } from "@/lib/weather"

export const maxDuration = 30

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.email) {
    return new Response("Unauthorized", { status: 401 })
  }
  const userEmail = session.user.email

  const { messages }: { messages: UIMessage[] } = await req.json()

  // Cargamos jardín + settings en paralelo: el system prompt necesita ambos
  // para poder dar contexto local (ciudad, alertas activadas, plantas).
  const [plantsRaw, settings] = await Promise.all([
    getAllPlants(userEmail),
    getUserSettings(userEmail),
  ])

  const plants = plantsRaw.map((p) => ({
    id: p.id,
    alias: p.alias,
    species: p.species,
    category: p.category,
    wateringFrequencyDays: p.wateringFrequencyDays,
    wateringMode: p.wateringMode,
    lightNeeds: p.lightNeeds,
    lastWateredAt: p.lastWateredAt
      ? new Date(p.lastWateredAt).toISOString().slice(0, 10)
      : "nunca",
  }))

  const city = settings.location.city || "Mendoza, Argentina"
  const alertPrefs = settings.location.alerts

  const system = `Sos "Secretary Botanic", un asistente experto en cuidado de plantas. Hablás en español rioplatense (vos, querés, regá), con tono cálido y didáctico, estilo "Mi Primera Encarta": claro, divertido y educativo.

CONTEXTO DEL USUARIO:
- Vive en ${city} (si la ciudad es Mendoza, recordá que es clima semiárido con sol intenso, viento Zonda y heladas tardías).
- Tiene ${plants.length} plantas registradas: ${JSON.stringify(plants)}
- Alertas climáticas activadas en su perfil: ${JSON.stringify(alertPrefs)}.
- Si una alerta está desactivada, NO la menciones de manera proactiva, salvo que el usuario la pregunte explícitamente.

CAPACIDADES MULTIMODALES:
- Tenés visión por computadora: cuando el usuario adjunte una foto, observá detenidamente forma de hoja, nervaduras, textura, color, tipo de tallo, presencia de espinas/flores, suelo y maceta antes de responder.
- Si la imagen es ambigua o tiene mala luz, decílo y pedí otra foto del envés de la hoja, del tallo o de un detalle puntual. NO adivines.
- Antes de afirmar una especie, dejá explícito el grado de certeza (alto / medio / bajo) y mencioná 1-2 alternativas posibles cuando la confianza no sea alta.

GUÍA DE PLANTAS DE INTERIOR COMUNES (úsala para no confundirte):
- Potus (Epipremnum aureum): hojas acorazonadas, lisas, brillantes, a veces variegadas (amarillo/blanco). Trepadora/colgante. NO tiene aroma.
- Filodendro corazón (Philodendron hederaceum): muy parecido al potus pero hoja más fina, mate, sin variegación.
- Costilla de Adán (Monstera deliciosa): hojas grandes con perforaciones y cortes laterales (fenestraciones). Tallo grueso.
- Cinta / Mala madre (Chlorophytum comosum): hojas largas tipo lanza, verdes con franja blanca/crema central.
- Sansevieria / Lengua de suegra: hojas rígidas, erectas, carnosas, en abanico, con bandas horizontales.
- ZZ (Zamioculcas zamiifolia): foliolos pequeños ovales, brillantes, dispuestos en raquis carnoso.
- Albahaca (Ocimum basilicum): planta herbácea baja, hojas ovaladas opuestas, dentadas suaves, MUY aromáticas al rozarlas, tallo cuadrado y tierno. NO trepa, NO tiene hojas grandes brillantes. Es comestible/aromática, no de interior decorativo.
- Suculentas vs cactus: las suculentas tienen hojas carnosas y rara vez espinas; los cactus tienen areolas con espinas y casi no tienen hojas verdaderas.

REGLA ANTI-CONFUSIÓN:
- NUNCA confundas un Potus con una Albahaca: el Potus tiene hojas grandes acorazonadas brillantes y trepa; la Albahaca es una hierba baja con hojas pequeñas aromáticas. Si dudás entre ambos, pedí una foto del tallo o que el usuario huela una hoja.

REGLAS DE HERRAMIENTAS:
- Si el usuario pregunta por el clima, riesgos meteorológicos o si conviene regar hoy → USÁ getWeatherAlerts antes de responder. Devuelve datos REALES tomados de Open-Meteo.
- Si el usuario quiere saber el pronóstico de los próximos días → USÁ getWeatherForecast.
- Si el usuario pide ver sus plantas o un resumen → USÁ listUserPlants.
- Si pregunta cuándo regar una planta puntual → USÁ checkWateringSchedule con el alias o id.
- Después de usar herramientas, resumí en 2-4 líneas con consejos concretos y accionables.
- No inventes datos del clima; siempre obtenelos con la herramienta.

ESTILO DE RESPUESTA:
- Respuestas cortas (2-5 líneas salvo que el usuario pida detalle).
- Usá emojis con moderación, sólo cuando aportan claridad (💧 riego, ☀️ luz, ❄️ helada).
- Si identificás mal una planta y el usuario te corrige, agradecele, ajustá tus recomendaciones a la especie correcta y sugerile usar el botón "Editar información" del escáner para sobrescribir lo que sugirió la IA.`

  const result = streamText({
    model: "openai/gpt-5-mini",
    system,
    messages: await convertToModelMessages(messages),
    stopWhen: stepCountIs(5),
    tools: {
      getWeatherAlerts: tool({
        description:
          "Obtiene alertas climáticas REALES (Open-Meteo) para la ciudad del usuario. Detecta viento Zonda (ráfagas + baja humedad), heladas, ola de calor y granizo combinando datos del pronóstico con las preferencias activadas en el perfil. Usar cuando el usuario pregunte por el clima o si conviene regar hoy.",
        inputSchema: z.object({
          reason: z.string().describe("Por qué se está consultando el clima"),
        }),
        execute: async () => {
          const forecast = await getForecast(city)
          const alerts = evaluateAlerts(forecast, alertPrefs)
          return {
            location: forecast.location.label,
            now: {
              tempC: Math.round(forecast.current.tempC),
              humidity: Math.round(forecast.current.humidity),
              windKmh: Math.round(forecast.current.windKmh),
            },
            alerts,
            preferencesUsed: alertPrefs,
          }
        },
      }),
      getWeatherForecast: tool({
        description:
          "Devuelve el pronóstico de los próximos 3 días para la ciudad del usuario: temperatura máxima/mínima, lluvia esperada, viento y humedad. Útil para planificar riegos y traslados de macetas.",
        inputSchema: z.object({
          reason: z.string().describe("Para qué se está pidiendo el forecast"),
        }),
        execute: async () => {
          const forecast = await getForecast(city)
          return {
            location: forecast.location.label,
            days: forecast.daily.map((d) => ({
              date: d.date,
              tempMaxC: Math.round(d.tempMaxC),
              tempMinC: Math.round(d.tempMinC),
              precipitationMm: Math.round(d.precipitationMm * 10) / 10,
              windMaxKmh: Math.round(d.windMaxKmh),
              windGustsMaxKmh: Math.round(d.windGustsMaxKmh),
              humidityMin: Math.round(d.humidityMin),
              weatherCode: d.weatherCode,
            })),
          }
        },
      }),
      listUserPlants: tool({
        description: "Lista todas las plantas registradas del usuario con su estado de riego.",
        inputSchema: z.object({}),
        execute: async () => {
          return { plants, total: plants.length }
        },
      }),
      checkWateringSchedule: tool({
        description:
          "Devuelve cuántos días pasaron desde el último riego de una planta y si toca regar.",
        inputSchema: z.object({
          aliasOrId: z.string().describe("Alias o id de la planta"),
        }),
        execute: async ({ aliasOrId }) => {
          const all = await getAllPlants(userEmail)
          const q = aliasOrId.toLowerCase()
          const plant = all.find(
            (p) => p.id.toLowerCase() === q || p.alias.toLowerCase() === q,
          )
          if (!plant) {
            return { found: false, message: `No encontré una planta con "${aliasOrId}".` }
          }
          const daysSince = plant.lastWateredAt
            ? Math.floor((Date.now() - plant.lastWateredAt) / (1000 * 60 * 60 * 24))
            : null
          const needsWater =
            daysSince === null || daysSince >= plant.wateringFrequencyDays
          return {
            found: true,
            alias: plant.alias,
            species: plant.species,
            wateringFrequencyDays: plant.wateringFrequencyDays,
            daysSinceLastWatering: daysSince,
            needsWater,
          }
        },
      }),
    },
  })

  return result.toUIMessageStreamResponse()
}
