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
  language: string = "es"
): ProactiveAdvice | null {
  // 1. Alerta más severa (prioridad: high > medium > low)
  const ranked = [...alerts].sort((a, b) => {
    const score = (s: WeatherAlert["severity"]) =>
      s === "high" ? 2 : s === "medium" ? 1 : 0
    return score(b.severity) - score(a.severity)
  })
  const trigger = ranked[0]
  if (!trigger) return null

  // 2. Plantas afectadas directamente por el clima severo
  const affected = trigger.type === "calm" ? [] : plantsAffected(plants, trigger.type)

  // 3. Lógica de lluvia preventiva (independiente de alertas críticas)
  const isRainingTomorrow = (trigger.precipitationTomorrow || 0) >= 5
  const exteriorPlants = plants.filter((p) => p.location === "exterior")

  if (trigger.type === "calm" && isRainingTomorrow && exteriorPlants.length > 0) {
    const sample = exteriorPlants.slice(0, 2).map((p) => p.alias)
    const sampleStr = sample.join(" y ")
    if (language === "en") {
      return {
        headline: `It rains tomorrow: don't water today.`,
        message: `Rain is expected tomorrow. Your outdoor plants like ${sampleStr} will get natural water, better save watering for today.`,
        severity: "low",
        affectedPlants: exteriorPlants.length,
        chatPrompt: `It's going to rain tomorrow. Do I need to bring my outdoor plants inside?`,
      }
    }
    return {
      headline: `Mañana llueve: no riegues hoy.`,
      message: `Se esperan lluvias para mañana. Tus plantas de exterior como ${sampleStr} ya tendrán agua natural, mejor ahorrá el riego hoy.`,
      severity: "low",
      affectedPlants: exteriorPlants.length,
      chatPrompt: `Mañana va a llover. ¿Tengo que entrar a mis plantas de exterior?`,
    }
  }

  // 4. Si es clima calmo y no llueve, damos un consejo de mantenimiento
  if (trigger.type === "calm") {
    // Si no tiene plantas, no damos consejo
    if (plants.length === 0) return null

    // Buscamos alguna planta que necesite atención o damos uno general
    const needsWater = plants.filter((p) => {
      if (!p.lastWateredAt) return true
      const daysSince = (Date.now() - p.lastWateredAt) / (1000 * 60 * 60 * 24)
      return daysSince >= p.wateringFrequencyDays
    })

    if (needsWater.length > 0) {
      const p = needsWater[0]
      if (language === "en") {
        return {
          headline: `Stable weather: time to care for ${p.alias}.`,
          message: `The weather is perfect to dedicate a few minutes to your garden. It's time for ${p.alias}'s scheduled ${p.wateringMode === "soil" ? "watering" : "maintenance"}.`,
          severity: "low",
          affectedPlants: needsWater.length,
          chatPrompt: `How is the weather today for watering my plants?`,
        }
      }
      return {
        headline: `Día estable: toca cuidar a ${p.alias}.`,
        message: `El clima está ideal para dedicarle unos minutos a tu jardín. A ${p.alias} ya le toca su ${p.wateringMode === "soil" ? "riego" : "mantenimiento"} programado.`,
        severity: "low",
        affectedPlants: needsWater.length,
        chatPrompt: `¿Cómo está el clima hoy para regar mis plantas?`,
      }
    }

    // Consejo genérico pero con nombre de planta
    const randomPlant = plants[Math.floor(Math.random() * plants.length)]
    if (language === "en") {
      return {
        headline: `Ideal weather for your plants.`,
        message: `Today is a great day to observe ${randomPlant.alias}'s growth and clean its leaves so it breathes better.`,
        severity: "low",
        affectedPlants: 1,
        chatPrompt: `Give me a care tip for ${randomPlant.alias} today.`,
      }
    }
    return {
      headline: `Clima ideal para tus plantas.`,
      message: `Hoy es un gran día para observar el crecimiento de ${randomPlant.alias} y limpiar sus hojas para que respire mejor.`,
      severity: "low",
      affectedPlants: 1,
      chatPrompt: `Dame un consejo de cuidado para ${randomPlant.alias} hoy.`,
    }
  }

  // 5. Casos de alertas críticas (Zonda, Helada, Ola de Calor, Granizo)
  // Si no hay plantas afectadas y la alerta no es alta, no mostramos nada
  if (affected.length === 0 && trigger.severity !== "high") return null

  const sample = affected.slice(0, 3).map((p) => p.alias)
  const sampleStr =
    sample.length === 0
      ? (language === "en" ? "my plants" : "mis plantas")
      : sample.length === 1
        ? sample[0]
        : sample.length === 2
          ? `${sample[0]} ${language === "en" ? "and" : "y"} ${sample[1]}`
          : `${sample[0]}, ${sample[1]} ${language === "en" ? "and" : "y"} ${affected.length - 2} ${language === "en" ? "more" : "más"}`

  let headline: string
  let message: string
  let chatPrompt: string

  switch (trigger.type) {
    case "zonda":
      headline =
        affected.length > 0
          ? (language === "en" ? `Zonda coming: protect ${sampleStr}.` : `Viene Zonda: protegé a ${sampleStr}.`)
          : (language === "en" ? `Zonda coming. Secure your plants.` : `Viene Zonda. Asegurá tus plantas.`)
      
      message = affected.length === 0 
        ? (language === "en" ? "Strong dry gusts can dehydrate your plants. Move any outdoor ones to a sheltered spot or secure their stakes." : "Las fuertes ráfagas secas pueden deshidratar tus plantas. Si tenés alguna afuera, movela a un lugar resguardado o asegurá sus tutores.")
        : (language === "en" ? `Your outdoor plant(s) risk dehydration. Bring what you can inside and secure stakes.` : `Tus ${affected.length === 1 ? "planta" : "plantas"} en exterior corren riesgo de deshidratarse. Llevá adentro lo que puedas y asegurá los tutores.`)
      
      chatPrompt = language === "en" ? `Zonda wind coming in ${trigger.location}. How do I protect ${sampleStr}?` : `Viene Zonda en ${trigger.location}. ¿Cómo protejo a ${sampleStr}?`
      break
      
    case "frost":
      headline =
        affected.length > 0
          ? (language === "en" ? `Frost on the way: cover ${sampleStr}.` : `Helada en camino: cubrí a ${sampleStr}.`)
          : (language === "en" ? `Frost tonight. Beware of the cold.` : `Helada esta noche. Cuidado con el frío.`)
          
      message = affected.length === 0
        ? (language === "en" ? "Freezing temperatures expected. If you have delicate plants outside, cover them with a blanket or clear film and avoid watering at dusk." : "Se esperan temperaturas bajo cero. Si tenés plantas delicadas afuera, cubrilas con una manta o film transparente y evitá regar al atardecer.")
        : (language === "en" ? `You have sensitive plants outdoors. Cover them with frost cloth or bring them inside tonight.` : `${affected.length === 1 ? "Tenés una planta sensible" : `Tenés ${affected.length} plantas sensibles`} al frío a la intemperie. Cubrilas con tela antihelada o metelas adentro esta noche.`)
        
      chatPrompt = language === "en" ? `There will be frost tonight. What do I do with ${sampleStr}?` : `Va a haber helada esta noche. ¿Qué hago con ${sampleStr}?`
      break
      
    case "heatwave":
      headline =
        affected.length > 0
          ? (language === "en" ? `Heatwave: water ${sampleStr}.` : `Ola de calor: regá a ${sampleStr}.`)
          : (language === "en" ? `Very hot day. Beware of the sun.` : `Día muy caluroso. Cuidado con el sol.`)
          
      message = affected.length === 0
        ? (language === "en" ? "High temperatures can wilt foliage. Ensure you water early in the morning or at dusk." : "Las altas temperaturas pueden marchitar el follaje. Asegurate de regar temprano por la mañana o al anochecer.")
        : (language === "en" ? `Intense heat can affect your plants. Try watering ${sampleStr} early morning or away from direct sun.` : `El calor intenso puede afectar a tus plantas. Tratá de regar a ${sampleStr} temprano a la mañana o lejos del sol directo.`)
        
      chatPrompt = language === "en" ? `It's very hot today. When and how do I water ${sampleStr}?` : `Hoy hace mucho calor. ¿Cuándo y cómo riego a ${sampleStr}?`
      break
      
    case "hail":
      headline =
        affected.length > 0
          ? (language === "en" ? `Hail: shelter ${sampleStr}.` : `Granizo: resguardá a ${sampleStr}.`)
          : (language === "en" ? `Possible hail in the area.` : `Posible granizo en la zona.`)
          
      message = affected.length === 0
        ? (language === "en" ? "Forecast indicates possible hail. Cover outdoor pots with crates or thick cloths if you can." : "El pronóstico indica posible caída de granizo. Tapá las macetas exteriores con cajones o telas gruesas si podés.")
        : (language === "en" ? `Your outdoor plants risk breaking. Try sheltering ${sampleStr} or cover them with something sturdy.` : `Tus plantas a la intemperie corren riesgo de romperse. Intentá resguardar a ${sampleStr} o cubrilas con algo resistente.`)
        
      chatPrompt = language === "en" ? `There is a hail alert. How do I protect ${sampleStr}?` : `Hay alerta de granizo. ¿Cómo protejo a ${sampleStr}?`
      break
      
    default:
      headline = trigger.title
      message = affected.length === 0 
        ? trigger.description 
        : (language === "en" ? `Weather alert that could affect ${sampleStr}. ${trigger.description}` : `Alerta climática que podría afectar a ${sampleStr}. ${trigger.description}`)
      chatPrompt = language === "en" ? `Tell me what to do with my garden regarding this alert: ${trigger.title}` : `Contame qué hago con mi jardín ante esta alerta: ${trigger.title}`
  }

  return {
    headline,
    message,
    severity: trigger.severity,
    affectedPlants: affected.length,
    chatPrompt,
  }
}
