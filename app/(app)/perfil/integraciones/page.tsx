import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { listMcpTokens } from "@/lib/db/mcp-tokens"
import { IntegrationsView } from "@/components/features/integrations-view"

export const metadata = {
  title: "Integraciones · Secretary Botanic",
  description:
    "Conectá Botanic con Claude, Apple Shortcuts, Alexa, Google Home y más vía MCP.",
}

export default async function IntegracionesPage() {
  const session = await auth()
  if (!session?.user?.email) {
    redirect("/login")
  }
  const tokens = await listMcpTokens(session.user.email)

  return <IntegrationsView initialTokens={tokens} />
}
