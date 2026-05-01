import { ProfileView } from "@/components/features/profile-view"
import { loadSettings } from "@/lib/actions/settings"

export const metadata = {
  title: "Ajustes de perfil · Secretary Botanic",
  description:
    "Editá tu información, configurá tu agente IA y personalizá las alertas climáticas.",
}

export default async function PerfilPage() {
  const settings = await loadSettings()
  return <ProfileView initialSettings={settings} />
}
