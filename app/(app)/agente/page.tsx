import { AgentView } from "@/components/features/agent-view"

export const metadata = {
  title: "Agente · Secretary Botanic",
}

// En Next.js 16 los searchParams del Server Component son async.
export default async function AgentePage({
  searchParams,
}: {
  searchParams: Promise<{ prompt?: string }>
}) {
  const params = await searchParams
  return <AgentView initialPrompt={params.prompt} />
}
