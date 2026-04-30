import "server-only"
import type { Plant, WeatherAlert } from "@/lib/types"

/**
 * "Asesor proactivo": dadas las alertas climáticas activas y el jardín del
 * usuario, decide si hay que avisar algo PERSONAL (ej: tenés suculentas afuera
 * y viene granizo). Devuelve null si no hay nada urgente.
 *
 * Es 100% determinístico (no usa IA) para mantener latencia ~0 y no gastar
 * tokens en cada home render. La forma del output incluye un `chatPrompt` que
 * usa el botón "Hablarlo con el agente" para abrir el chat con la pregunta
 * pre-cargada.
 */

export interface ProactiveAdvice {
  /** Frase corta tipo titular que va arriba. */
  headline: string
  /** Cuerpo más explicativo (2-3 frases). */
  message: string
  /** Severidad heredada de la alerta principal que disparó el aviso. */
  severity: "low" | "medium" | "high"
  /** Cuántas plantas del jardín están en riesgo según la alerta. */
  affectedPlants: number
  /** Pregunta sugerida para abrir el chat con contexto ya armado. */
  chatPrompt: string
}

/**
 * Heurísticas de qué planta corre riesgo según el tipo de alerta, ahora
 * basadas en la UBICACIÓN FÍSICA de la planta (no en su categoría botánica).
 *
 *  - zonda    : siente viento → exterior + cubierto + invernadero (filtra interior).
 *  - frost    : siente temperatura → exterior + cubierto + invernadero (interior se salva).
 *  - heatwave : siente temperatura → exterior + cubierto + invernadero.
 *  - hail     : sólo lo que está EXPUESTO al cielo abierto → exterior.
 *
 * Dentro de cada conjunto aplico filtros adicionales por sensibilidad
 * botánica para no marcar como riesgo cualquier cosa al pedo (ej: una rosa
 * a una helada le da igual; una albahaca se muere).
 */
function plantsAffected(plants: Plant[], type: WeatherAlert["type"]): Plant[] {
  // Step 1: filtro por exposición física.
  let exposed: Plant[] = []
  switch (type) {
    case "zonda":
    case "frost":
    case "heatwave":
      exposed = plants.filter(
        (p) => p.location === "exterior" || p.location === "cubierto",
      )
      break
    case "hail":
      // Granizo SOLO afecta a las que están al cielo abierto.
      exposed = plants.filter((p) => p.location === "exterior")
      break
    default:
      return []
  }

  // Step 2: filtro por sensibilidad botánica.
  switch (type) {
    case "zonda":
      // Viento seco: epífitas se secan en horas; suculentas en macetas chicas
      // se vuelan; hojas grandes (tropicales) se rompen.
      return exposed.filter(
        (p) =>
          p.category === "epifita" ||
          p.category === "tropical" ||
          p.category === "suculenta" ||
          p.category === "comestible" ||
          p.category === "floracion",
      )
    case "frost":
      // Heladas: tropicales, comestibles tiernas y suculentas no aclimatadas.
      return exposed.filter(
        (p) =>
          p.category === "tropical" ||
          p.category === "comestible" ||
          p.category === "suculenta" ||
          p.category === "floracion" ||
          p.category === "epifita",
      )
    case "heatwave":
      // Olas de calor: tropicales y comestibles sufren primero.
      return exposed.filter(
        (p) =>
          p.category === "tropical" ||
          p.category === "comestible" ||
          p.category === "floracion" ||
          p.category === "interior", // tropicales típicas de interior puestas afuera
      )
    case "hail":
      // Granizo arruina hojas grandes y tallos tiernos sin discriminar mucho.
      return exposed
    default:
      return []
  }
}

export function buildProactiveAdvice(
  alerts: WeatherAlert[],
  plants: Plant[],
): ProactiveAdvice | null {
  // Tomamos la alerta más urgente que NO sea "calm".
  const ranked = [...alerts].sort((a, b) => {
    const score = (s: WeatherAlert["severity"]) =>
      s === "high" ? 2 : s === "medium" ? 1 : 0
    return score(b.severity) - score(a.severity)
  })
  const trigger = ranked.find((a) => a.type !== "calm")
  if (!trigger) return null

  const affected = plantsAffected(plants, trigger.type)
  // Si el usuario aún no tiene plantas o ninguna está en riesgo concreto,
  // todavía es útil mostrar consejo general en alta severidad.
  if (affected.length === 0 && trigger.severity !== "high") return null

  const sample = affected.slice(0, 3).map((p) => p.alias)
  const sampleStr =
    sample.length === 0
      ? "tus plantas"
      : sample.length === 1
        ? sample[0]
        : sample.length === 2
          ? `${sample[0]} y ${sample[1]}`
          : `${sample[0]}, ${sample[1]} y ${affected.length - 2} más`

  let headline: string
  let message: string
  let chatPrompt: string

  switch (trigger.type) {
    case "zonda":
      headline =
        affected.length > 0
          ? `Viene Zonda: protegé ${sampleStr}.`
          : `Viene Zonda. Asegurá tus plantas.`
      message = `${affected.length === 0 ? "Tus plantas en exterior están" : `${affected.length} ${affected.length === 1 ? "planta tuya está" : "plantas tuyas están"}`} en riesgo de deshidratarse con las ráfagas secas. ${trigger.recommendation}`
      chatPrompt = `Viene Zonda en ${trigger.location}. ¿Cómo protejo a ${sampleStr}?`
      break
    case "frost":
      headline =
        affected.length > 0
          ? `Helada en camino: cubrí ${sampleStr}.`
          : `Helada esta noche. Cuidado con tus plantas afuera.`
      message = `${affected.length === 0 ? "Las plantas que tengas afuera" : `${affected.length} ${affected.length === 1 ? "planta sensible al frío te queda" : "plantas sensibles al frío te quedan"}`} sin abrigo. ${trigger.recommendation}`
      chatPrompt = `Va a haber helada esta noche. ¿Qué hago con ${sampleStr}?`
      break
    case "heatwave":
      headline =
        affected.length > 0
          ? `Día caluroso: regá temprano a ${sampleStr}.`
          : `Día muy caluroso. Cuidado con tus plantas afuera.`
      message = `${affected.length === 0 ? "Las plantas en cubierto y exterior" : `${affected.length} ${affected.length === 1 ? "planta puede sufrir" : "plantas pueden sufrir"}`} con la máxima prevista. ${trigger.recommendation}`
      chatPrompt = `Hoy hace mucho calor. ¿Cuándo y cómo riego a ${sampleStr}?`
      break
    case "hail":
      headline =
        affected.length > 0
          ? `Granizo: metelas adentro a ${sampleStr}.`
          : `Posible granizo en la zona.`
      message = `${affected.length === 0 ? "Si tenés plantas afuera" : `${affected.length} ${affected.length === 1 ? "planta tuya está" : "plantas tuyas están"} a la intemperie y`} pueden romperse con el granizo. ${trigger.recommendation}`
      chatPrompt = `Hay alerta de granizo. ¿Cómo protejo a ${sampleStr}?`
      break
    default:
      headline = trigger.title
      message = `${trigger.description} ${trigger.recommendation}`
      chatPrompt = `Contame qué hago con mi jardín ante esta alerta: ${trigger.title}`
  }

  return {
    headline,
    message,
    severity: trigger.severity,
    affectedPlants: affected.length,
    chatPrompt,
  }
}
