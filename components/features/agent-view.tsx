import { Sparkles } from "lucide-react"
import { ChatPanel } from "./chat-panel"
import { ScreenHeader } from "@/components/mobile/screen-header"

export function AgentView() {
  return (
    <div className="flex flex-col">
      <ScreenHeader
        icon={<Sparkles className="size-5" aria-hidden="true" />}
        eyebrow="Agente IA · Mendoza"
        title="Conversá con tu agente"
        subtitle="Pregunta sobre clima, riegos y cuidados."
      />
      <ChatPanel />
    </div>
  )
}
