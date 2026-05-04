"use client"

import { Sparkles } from "lucide-react"
import { ChatPanel } from "./chat-panel"
import { ScreenHeader } from "@/components/mobile/screen-header"
import { useLanguage } from "@/lib/i18n/context"

export function AgentView({ initialPrompt }: { initialPrompt?: string }) {
  const { t } = useLanguage()
  
  return (
    <div className="flex flex-col mt-[25px]">
      <ScreenHeader
        icon={<Sparkles className="size-5" aria-hidden="true" />}
        eyebrow={t("agent", "eyebrow") || "Agente IA"}
        title={t("agent", "title")}
        subtitle={t("agent", "subtitle")}
      />
      <ChatPanel initialPrompt={initialPrompt} />
    </div>
  )
}
