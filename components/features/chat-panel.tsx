"use client"

import { useEffect, useRef, useState } from "react"
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import { Bot, Send, Sparkles, User, Wrench } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  InputGroup,
  InputGroupInput,
  InputGroupAddon,
} from "@/components/ui/input-group"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"

const SUGGESTIONS = [
  "¿Conviene regar hoy en Mendoza?",
  "Resumime el estado de mis plantas",
  "¿Cuándo riego a Felipe?",
  "Tips para suculentas con sol intenso",
]

export function ChatPanel({ initialPrompt }: { initialPrompt?: string }) {
  const [input, setInput] = useState("")
  const scrollRef = useRef<HTMLDivElement>(null)
  const initialPromptSent = useRef(false)
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  })

  const isStreaming = status === "streaming" || status === "submitted"

  // Disparamos el prompt que viene por ?prompt=... una sola vez al montar.
  // Sirve para los CTAs proactivos del home ("Hablarlo con el agente").
  useEffect(() => {
    if (initialPrompt && !initialPromptSent.current) {
      initialPromptSent.current = true
      sendMessage({ text: initialPrompt })
    }
  }, [initialPrompt, sendMessage])

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    })
  }, [messages, isStreaming])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || isStreaming) return
    sendMessage({ text: input })
    setInput("")
  }

  function handleSuggestion(text: string) {
    if (isStreaming) return
    sendMessage({ text })
  }

  return (
    <div className="flex h-[calc(100dvh-9.5rem)] flex-col">
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-5 pb-[calc(5rem+env(safe-area-inset-bottom))]"
      >
        <div className="flex flex-col gap-4 py-2 pb-6 mt-[50px]">
          {messages.length === 0 ? (
            <div className="space-y-4 py-4 text-center">
              <div className="bg-secondary mx-auto flex size-14 items-center justify-center rounded-2xl shadow-soft">
                <Bot className="text-primary size-7" aria-hidden="true" />
              </div>
              <div>
                <p className="font-serif text-lg font-semibold">
                  Hola, ¿en qué te ayudo?
                </p>
                <p className="mt-1 text-sm text-muted-foreground text-pretty">
                  Reviso el clima de Mendoza, sugiero riegos y doy tips por
                  especie.
                </p>
              </div>
              <div className="flex flex-col gap-2 pt-2 items-center">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => handleSuggestion(s)}
                    className="rounded-2xl border-2 border-border bg-card px-4 py-3 text-center text-sm font-medium shadow-soft transition-colors hover:border-primary/40 hover:bg-secondary/50 active:scale-[0.99] w-full max-w-xs"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {messages.map((m) => (
            <MessageBubble key={m.id} message={m} />
          ))}

          {isStreaming &&
          messages[messages.length - 1]?.role === "user" ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Spinner className="size-4" />
              Pensando...
            </div>
          ) : null}
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="fixed inset-x-0 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-30 mx-auto w-full max-w-md border-t-2 border-border bg-card/95 px-5 py-3 backdrop-blur-md"
      >
        <InputGroup className="rounded-2xl border-2">
          <InputGroupInput
            placeholder="Escribí tu pregunta..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isStreaming}
            aria-label="Mensaje al agente"
          />
          <InputGroupAddon align="inline-end">
            <Button
              type="submit"
              size="icon-sm"
              disabled={!input.trim() || isStreaming}
              className="rounded-xl"
              aria-label="Enviar mensaje"
            >
              <Send className="size-4" aria-hidden="true" />
            </Button>
          </InputGroupAddon>
        </InputGroup>
      </form>
    </div>
  )
}

function MessageBubble({
  message,
}: {
  message: ReturnType<typeof useChat>["messages"][number]
}) {
  const isUser = message.role === "user"

  return (
    <div
      className={cn(
        "flex items-start gap-2.5",
        isUser ? "flex-row-reverse" : "flex-row",
      )}
    >
      <div
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-xl shadow-soft",
          isUser
            ? "bg-accent text-accent-foreground"
            : "bg-primary text-primary-foreground",
        )}
        aria-hidden="true"
      >
        {isUser ? (
          <User className="size-4" />
        ) : (
          <Sparkles className="size-4" />
        )}
      </div>
      <div
        className={cn(
          "flex max-w-[85%] flex-col gap-1.5 rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-soft",
          isUser
            ? "bg-accent text-accent-foreground rounded-tr-sm"
            : "bg-card text-card-foreground border-2 border-border rounded-tl-sm",
        )}
      >
        {message.parts.map((part, i) => {
          if (part.type === "text") {
            return (
              <p key={i} className="whitespace-pre-wrap text-pretty">
                {part.text}
              </p>
            )
          }
          if (part.type?.startsWith("tool-")) {
            return <ToolBadge key={i} part={part} />
          }
          return null
        })}
      </div>
    </div>
  )
}

function ToolBadge({ part }: { part: any }) {
  const toolName = part.type.replace(/^tool-/, "")
  const labels: Record<string, string> = {
    getWeatherAlerts: "Consultando clima en vivo",
    getWeatherForecast: "Pidiendo pronóstico de 3 días",
    listUserPlants: "Revisando tu jardín",
    checkWateringSchedule: "Calculando próximo riego",
  }
  const label = labels[toolName] ?? toolName
  const done = part.state === "output-available"

  return (
    <div className="bg-secondary/70 inline-flex items-center gap-2 self-start rounded-full border border-border px-3 py-1 text-xs font-medium">
      {done ? (
        <Wrench className="text-primary size-3" aria-hidden="true" />
      ) : (
        <Spinner className="size-3" />
      )}
      <span>{label}</span>
      {done ? <span className="text-muted-foreground">· listo</span> : null}
    </div>
  )
}
