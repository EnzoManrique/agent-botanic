"use client"

import { Terminal, X, Code, Copy, Check } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/lib/i18n/context"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  origin: string
}

export function DeveloperTutorial({ open, onOpenChange, origin }: Props) {
  const { language } = useLanguage()
  const mcpUrl = `${origin}/api/mcp`
  const voiceUrl = `${origin}/api/voice`

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="bg-background max-h-[92vh]">
        <DrawerHeader className="px-5 pt-2 pb-3 text-left">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <span
                aria-hidden="true"
                className="bg-primary text-primary-foreground flex size-12 shrink-0 items-center justify-center rounded-2xl shadow-soft"
              >
                <Terminal className="size-6" strokeWidth={2.2} />
              </span>
              <div className="flex flex-col gap-1">
                <DrawerTitle className="font-serif text-2xl font-bold leading-tight">
                  {language === "en" ? "Developer Guide" : "Guía para Developers"}
                </DrawerTitle>
                <DrawerDescription className="text-sm leading-relaxed text-pretty">
                  {language === "en" ? "Bring Botanic's logic to your own scripts." : "Llevá la lógica de Botanic a tus propios scripts."}
                </DrawerDescription>
              </div>
            </div>
            <DrawerClose asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="Cerrar"
                className="rounded-xl"
              >
                <X className="size-4" aria-hidden="true" />
              </Button>
            </DrawerClose>
          </div>
        </DrawerHeader>

        <div className="overflow-y-auto px-5 pb-8 flex flex-col gap-5">
          <section className="rounded-2xl border-2 border-border bg-card p-4">
            <h3 className="mb-2 flex items-center gap-2 font-serif text-base font-bold text-primary">
              <Code className="size-4" />
              {language === "en" ? "REST API (Plain Text)" : "REST API (Texto Plano)"}
            </h3>
            <p className="text-xs leading-relaxed text-muted-foreground text-pretty mb-3">
              {language === "en" ? "Ultra-lightweight endpoint designed for voice assistants or simple scripts. Returns clean text in Spanish. Use parameters ?q=regar, ?q=plantas or ?q=clima." : "Endpoint ultra-liviano pensado para asistentes de voz o scripts simples. Devuelve texto limpio en español. Usá los parámetros ?q=regar, ?q=plantas o ?q=clima."}
            </p>
            <CopyBlock
              value={`curl -X GET "${voiceUrl}?q=regar" \\\n  -H "Authorization: Bearer TU_TOKEN_ACA"`}
              label={language === "en" ? "cURL Example" : "Ejemplo con cURL"}
              language={language}
              multiline
            />
          </section>

          <section className="rounded-2xl border-2 border-border bg-card p-4">
            <h3 className="mb-2 flex items-center gap-2 font-serif text-base font-bold text-primary">
              <Terminal className="size-4" />
              MCP Server (JSON-RPC)
            </h3>
            <p className="text-xs leading-relaxed text-muted-foreground text-pretty mb-3">
              {language === "en" ? "MCP protocol compatible endpoint. Ideal to integrate in LLM flows or conversational agents. We expose tools like list_plants and get_weather_alerts." : "Endpoint compatible con el protocolo MCP. Ideal para integrar en flujos de LLM o agentes conversacionales. Exponemos herramientas como list_plants y get_weather_alerts."}
            </p>
            <CopyBlock
              value={`curl -X POST ${mcpUrl} \\\n  -H "Authorization: Bearer TU_TOKEN_ACA" \\\n  -H "Content-Type: application/json" \\\n  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'`}
              label={language === "en" ? "List Tools (cURL)" : "Listar Herramientas (cURL)"}
              language={language}
              multiline
            />
          </section>
        </div>
      </DrawerContent>
    </Drawer>
  )
}

function CopyBlock({ value, label, multiline = false, language = "es" }: { value: string; label: string; multiline?: boolean, language?: string }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      toast.error(language === "en" ? "Could not copy to clipboard." : "No pude copiar al portapapeles.")
    }
  }

  return (
    <div className="mb-2 last:mb-0 relative group">
      <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <button
        type="button"
        onClick={handleCopy}
        className={cn(
          "bg-secondary/50 flex w-full flex-col gap-2 rounded-xl border border-border p-3 text-left transition-colors",
          "hover:bg-secondary/80 active:bg-secondary",
        )}
        aria-label={`Copiar ${label}`}
      >
        <pre className={cn("overflow-hidden font-mono text-[10px] leading-relaxed text-foreground", multiline ? "whitespace-pre-wrap" : "whitespace-nowrap overflow-ellipsis")}>
          {value}
        </pre>
      </button>
      <div className="absolute top-6 right-2">
        {copied ? (
           <Check className="text-primary size-4 shrink-0" />
        ) : (
           <Copy className="text-muted-foreground size-4 shrink-0 opacity-50 group-hover:opacity-100 transition-opacity" />
        )}
      </div>
    </div>
  )
}
