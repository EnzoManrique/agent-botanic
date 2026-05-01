"use client"

import { Bell, FlaskConical, Heart, MessageSquare, Sparkles } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Field, FieldGroup, FieldLabel, FieldDescription } from "@/components/ui/field"
import { SettingsSection } from "./settings-section"
import type { AdviceFrequency, AgentPersonality, UserSettings } from "@/lib/types"

interface AgentSettingsCardProps {
  agent: UserSettings["agent"]
  onChange: (agent: UserSettings["agent"]) => void
}

const PERSONALITY_LABEL: Record<AgentPersonality, string> = {
  scientist: "Científico (formal y preciso)",
  friendly: "Amistoso (lúdico y cálido)",
  guru: "Gurú zen (sabio y pausado)",
}

const FREQUENCY_LABEL: Record<AdviceFrequency, string> = {
  proactive: "Proactivo (notificaciones automáticas)",
  manual: "Manual (sólo cuando pregunto)",
}

export function AgentSettingsCard({ agent, onChange }: AgentSettingsCardProps) {
  return (
    <SettingsSection
      icon={<Sparkles className="size-5" />}
      title="Configuración del agente"
      description="Ajustá cómo te habla y cuándo aparece tu jardinero IA."
    >
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="agent-personality">Personalidad</FieldLabel>
          <Select
            value={agent.personality}
            onValueChange={(v) =>
              onChange({ ...agent, personality: v as AgentPersonality })
            }
          >
            <SelectTrigger
              id="agent-personality"
              className="rounded-2xl border-2 border-border bg-card font-medium shadow-soft"
            >
              <SelectValue placeholder="Elegí un tono" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl">
              <SelectItem value="scientist">
                <span className="flex items-center gap-2">
                  <FlaskConical className="size-4" aria-hidden="true" />
                  {PERSONALITY_LABEL.scientist}
                </span>
              </SelectItem>
              <SelectItem value="friendly">
                <span className="flex items-center gap-2">
                  <Heart className="size-4" aria-hidden="true" />
                  {PERSONALITY_LABEL.friendly}
                </span>
              </SelectItem>
              <SelectItem value="guru">
                <span className="flex items-center gap-2">
                  <Sparkles className="size-4" aria-hidden="true" />
                  {PERSONALITY_LABEL.guru}
                </span>
              </SelectItem>
            </SelectContent>
          </Select>
          <FieldDescription>
            Define el tono de las respuestas en el chat del agente.
          </FieldDescription>
        </Field>

        <Field>
          <FieldLabel htmlFor="agent-frequency">
            Frecuencia de consejos
          </FieldLabel>
          <Select
            value={agent.adviceFrequency}
            onValueChange={(v) =>
              onChange({ ...agent, adviceFrequency: v as AdviceFrequency })
            }
          >
            <SelectTrigger
              id="agent-frequency"
              className="rounded-2xl border-2 border-border bg-card font-medium shadow-soft"
            >
              <SelectValue placeholder="Elegí cuándo te avisa" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl">
              <SelectItem value="proactive">
                <span className="flex items-center gap-2">
                  <Bell className="size-4" aria-hidden="true" />
                  {FREQUENCY_LABEL.proactive}
                </span>
              </SelectItem>
              <SelectItem value="manual">
                <span className="flex items-center gap-2">
                  <MessageSquare className="size-4" aria-hidden="true" />
                  {FREQUENCY_LABEL.manual}
                </span>
              </SelectItem>
            </SelectContent>
          </Select>
          <FieldDescription>
            Proactivo te avisa antes de heladas, riegos o vientos fuertes.
          </FieldDescription>
        </Field>
      </FieldGroup>
    </SettingsSection>
  )
}
