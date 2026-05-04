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

import { useLanguage } from "@/lib/i18n/context"

interface AgentSettingsCardProps {
  agent: UserSettings["agent"]
  onChange: (agent: UserSettings["agent"]) => void
}

export function AgentSettingsCard({ agent, onChange }: AgentSettingsCardProps) {
  const { t, language } = useLanguage()

  const PERSONALITY_LABEL: Record<AgentPersonality, string> = {
    scientist: language === "en" ? "Scientist (formal and precise)" : "Científico (formal y preciso)",
    friendly: language === "en" ? "Friendly (playful and warm)" : "Amistoso (lúdico y cálido)",
    guru: language === "en" ? "Zen Guru (wise and slow)" : "Gurú zen (sabio y pausado)",
  }

  const FREQUENCY_LABEL: Record<AdviceFrequency, string> = {
    proactive: language === "en" ? "Proactive (automatic notifications)" : "Proactivo (notificaciones automáticas)",
    manual: language === "en" ? "Manual (only when I ask)" : "Manual (sólo cuando pregunto)",
  }

  return (
    <SettingsSection
      icon={<Sparkles className="size-5" />}
      title={t("profile", "agent_settings_title")}
      description=""
    >
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="agent-personality">{t("profile", "agent_settings_title")}</FieldLabel>
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
            {t("profile", "agent_settings_desc")}
          </FieldDescription>
        </Field>

        <Field>
          <FieldLabel htmlFor="agent-frequency">
            {t("profile", "advice_frequency")}
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
            {t("profile", "advice_desc")}
          </FieldDescription>
        </Field>
      </FieldGroup>
    </SettingsSection>
  )
}
