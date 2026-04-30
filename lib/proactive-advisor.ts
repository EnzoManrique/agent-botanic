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

const OUTDOOR_CATEGORIES = new Set([
  "exterior",
  "comestible",
  "floracion",
  "arbol",
])

const SUCCULENT_LIKE = new Set(["suculenta"])

/**
 * Heurísticas de qué planta corre riesgo según el tipo de alerta:
 *  - Zonda      : todo lo de exterior y todas las epífitas (se secan rapidísimo).
 *  - Frost      : suculentas, comestibles, flores y exterior.
 *  - Heatwave   : todo lo que esté al sol (exterior + comestibles + tropicales delicadas).
 *  - Granizo    : exterior y comestibles, las hojas grandes son las que más sufren.
 */
function plantsAffected(plants: Plant[], type: WeatherAlert["type"]): Plant[] {
  switch (type) {
    case "zonda":
      return plants.filter(
        (p) => OUTDOOR_CATEGORIES.has(p.category) || p.category === "epifita",
      )
    case "frost":
      return plants.filter(
        (p) =>
          OUTDOOR_CATEGORIES.has(p.category) ||
          SUCCULENT_LIKE.has(p.category) ||
          p.category === "tropical",
      )
    case "heatwave":
      return plants.filter(
        (p) => OUTDOOR_CATEGORIES.has(p.category) || p.category === "tropical",
      )
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
      headline = `Viene Zonda: protegé ${sampleStr}.`
      message = `${affected.length} ${affected.length === 1 ? "planta tuya está" : "plantas tuyas están"} en riesgo de deshidratarse con las ráfagas secas. ${trigger.recommendation}`
      chatPrompt = `Viene Zonda en ${trigger.location}. ¿Cómo protejo a ${sampleStr}?`
      break
    case "frost":
      headline = `Helada en camino: cubrí ${sampleStr}.`
      message = `${affected.length} ${affected.length === 1 ? "planta sensible al frío te queda" : "plantas sensibles al frío te quedan"} sin abrigo. ${trigger.recommendation}`
      chatPrompt = `Va a haber helada esta noche. ¿Qué hago con ${sampleStr}?`
      break
    case "heatwave":
      headline = `Día caluroso: regá temprano a ${sampleStr}.`
      message = `${affected.length} ${affected.length === 1 ? "planta puede sufrir" : "plantas pueden sufrir"} con la máxima prevista. ${trigger.recommendation}`
      chatPrompt = `Hoy hace mucho calor. ¿Cuándo y cómo riego a ${sampleStr}?`
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
