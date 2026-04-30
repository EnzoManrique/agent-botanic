import { redirect } from "next/navigation"
import { HomeView } from "@/components/features/home-view"
import { getAllPlants } from "@/lib/db/plants"
import { getUserSettings } from "@/lib/db/settings"
import { getWeatherSummary } from "@/lib/weather"
import { buildProactiveAdvice } from "@/lib/proactive-advisor"
import type { WeatherAlert } from "@/lib/types"
import { auth } from "@/auth"

export default async function Home() {
  const session = await auth()
  if (!session?.user?.email) {
    redirect("/login")
  }

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
      settings.location.alerts,
    )
    alerts = summary.alerts
    primaryAlert = alerts[0]
  } catch (error) {
    console.error("[v0] Home: error obteniendo clima:", error)
    primaryAlert = {
      type: "calm" as const,
      severity: "low" as const,
      title: "Clima sin datos",
      description:
        "No pudimos contactar al servicio de clima. Probá refrescar en un rato.",
      recommendation:
        "Mientras tanto, revisá si tus plantas necesitan agua y aprovechá para limpiar hojas.",
      location: settings.location.city,
      validUntil: "—",
    }
  }

  const advice =
    settings.agent.adviceFrequency === "proactive"
      ? buildProactiveAdvice(alerts, plants)
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
