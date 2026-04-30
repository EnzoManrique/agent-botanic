import { redirect } from "next/navigation"
import { HomeView } from "@/components/features/home-view"
import { getAllPlants } from "@/lib/db/plants"
import { getMendozaWeatherAlert } from "@/lib/weather"
import { auth } from "@/auth"

export default async function Home() {
  const session = await auth()
  if (!session?.user?.email) {
    redirect("/login")
  }
  const plants = await getAllPlants(session.user.email)
  const weather = getMendozaWeatherAlert()
  return <HomeView initialPlants={plants} weather={weather} />
}
