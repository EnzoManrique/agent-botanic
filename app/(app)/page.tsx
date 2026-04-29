import { HomeView } from "@/components/features/home-view"
import { getAllPlants } from "@/lib/store"
import { getMendozaWeatherAlert } from "@/lib/weather"

export default async function Home() {
  const plants = getAllPlants()
  const weather = getMendozaWeatherAlert()
  return <HomeView initialPlants={plants} weather={weather} />
}
