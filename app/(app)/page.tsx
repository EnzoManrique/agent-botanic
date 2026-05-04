import { redirect } from "next/navigation"
import { HomeView } from "@/components/features/home-view"
import { getAllPlants } from "@/lib/db/plants"
import { getUserSettings } from "@/lib/db/settings"
import { getWeatherSummary } from "@/lib/weather"
import { buildProactiveAdvice } from "@/lib/proactive-advisor"
import type { WeatherAlert } from "@/lib/types"
import { auth } from "@/auth"

import { cookies } from "next/headers"

export default async function Home() {
  const session = await auth()
  if (!session?.user?.email) {
    redirect("/login")
  }

  const cookieStore = await cookies()
  const language = cookieStore.get("botanic-lang")?.value || "es"

  const [plants, settings] = await Promise.all([
    getAllPlants(session.user.email),
    getUserSettings(session.user.email),
  ])

  // Si el clima falla (sin red, API caída) seguimos renderizando con un
  // banner "calmo": preferimos UX degradada antes que un crash.
  let alerts: WeatherAlert[] = []
  let primaryAlert: WeatherAlert
  try {
    const summary = await getWeatherSummary(
      settings.location.city,
      {
        ...settings.location.alerts,
        lat: settings.location.lat,
        lng: settings.location.lng,
      },
    )
    alerts = summary.alerts
    primaryAlert = alerts[0]
  } catch (error) {
    console.error("[v0] Home: error obteniendo clima:", error)
    primaryAlert = {
      type: "calm" as const,
      severity: "low" as const,
      title: language === "en" ? "Weather unavailable" : "Clima sin datos",
      description: language === "en" 
        ? "Could not contact weather service. Try refreshing later." 
        : "No pudimos contactar al servicio de clima. Probá refrescar en un rato.",
      recommendation: language === "en"
        ? "Meanwhile, check if your plants need water and clean their leaves."
        : "Mientras tanto, revisá si tus plantas necesitan agua y aprovechá para limpiar hojas.",
      location: settings.location.city,
      validUntil: "—",
    }
  }

  const advice =
    settings.agent.adviceFrequency === "proactive"
      ? buildProactiveAdvice(alerts, plants, language)
      : null

  return (
    <HomeView
      initialPlants={plants}
      weather={primaryAlert}
      extraAlerts={alerts.slice(1)}
      advice={advice}
    />
  )
}
