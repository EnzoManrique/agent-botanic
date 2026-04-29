import type { WeatherAlert } from "@/lib/types"

/**
 * Simulated Mendoza weather. Returns a deterministic-ish alert
 * based on the day so the demo experience is consistent.
 */
export function getMendozaWeatherAlert(): WeatherAlert {
  const day = new Date().getDate() % 4

  if (day === 0) {
    return {
      type: "zonda",
      severity: "high",
      title: "Alerta por viento Zonda",
      description:
        "Se esperan ráfagas de viento Zonda de hasta 90 km/h con baja humedad sobre el Gran Mendoza.",
      recommendation:
        "Movés las macetas exteriores a un lugar resguardado y revisá tutores. Adelantá un riego ligero a las plantas sensibles para compensar la deshidratación.",
      location: "Mendoza, Argentina",
      validUntil: "Hoy 22:00",
    }
  }

  if (day === 1) {
    return {
      type: "frost",
      severity: "medium",
      title: "Riesgo de helada nocturna",
      description: "Temperatura mínima estimada de -1 °C entre las 04:00 y 07:00.",
      recommendation:
        "Cubrí suculentas y comestibles con una manta o film. Evitá regar al atardecer para no congelar la raíz.",
      location: "Mendoza, Argentina",
      validUntil: "Mañana 08:00",
    }
  }

  if (day === 2) {
    return {
      type: "heatwave",
      severity: "medium",
      title: "Ola de calor",
      description: "Temperaturas máximas previstas de 36 °C con sol directo intenso.",
      recommendation:
        "Regá temprano por la mañana y movés las plantas de hoja delicada lejos de ventanas con sol directo del mediodía.",
      location: "Mendoza, Argentina",
      validUntil: "Hoy 20:00",
    }
  }

  return {
    type: "calm",
    severity: "low",
    title: "Clima estable",
    description: "Sin alertas activas. Temperaturas suaves y viento leve.",
    recommendation: "Día ideal para revisar el sustrato y rotar las macetas.",
    location: "Mendoza, Argentina",
    validUntil: "Hoy 23:59",
  }
}
