"use client"

import { Bot, X, FileJson, Copy, Check } from "lucide-react"
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

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  origin: string
}

export function ClaudeDesktopTutorial({ open, onOpenChange, origin }: Props) {
  const mcpUrl = `${origin}/api/mcp`
  
  const configJson = `{
  "mcpServers": {
    "botanic": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-everything"
      ],
      "env": {
        "BOTANIC_URL": "${mcpUrl}",
        "BOTANIC_TOKEN": "botanic_TU_TOKEN_ACA"
      }
    }
  }
}`

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
                <Bot className="size-6" strokeWidth={2.2} />
              </span>
              <div className="flex flex-col gap-1">
                <DrawerTitle className="font-serif text-2xl font-bold leading-tight">
                  Claude Desktop
                </DrawerTitle>
                <DrawerDescription className="text-sm leading-relaxed text-pretty">
                  Hablá con Claude sobre tus plantas conectando nuestro servidor MCP.
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

        <div className="overflow-y-auto px-5 pb-8 flex flex-col gap-4">
          <section className="rounded-2xl border-2 border-border bg-card p-4">
            <h3 className="mb-2 flex items-center gap-2 font-serif text-base font-bold text-primary">
              <FileJson className="size-4" />
              Configuración claude_desktop_config.json
            </h3>
            <p className="text-xs leading-relaxed text-muted-foreground text-pretty mb-3">
              Abrí la configuración de Claude Desktop y agregá este código. Reemplazá <code>botanic_TU_TOKEN_ACA</code> por el token generado arriba.
            </p>
            <CopyBlock value={configJson} label="Configuración JSON" multiline />
            <p className="mt-3 text-[10px] leading-relaxed text-muted-foreground text-pretty">
              Nota técnica: Botanic usa un endpoint SSE remoto. Asegurate de usar el cliente MCP de proxy o un adaptador de red si usás una versión antigua de Claude.
            </p>
          </section>
        </div>
      </DrawerContent>
    </Drawer>
  )
}

function CopyBlock({ value, label, multiline = false }: { value: string; label: string; multiline?: boolean }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      toast.error("No pude copiar al portapapeles.")
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
        <pre className={cn("overflow-x-auto font-mono text-[10px] leading-relaxed text-foreground", multiline ? "whitespace-pre" : "whitespace-nowrap")}>
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
