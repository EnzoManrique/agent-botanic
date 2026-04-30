"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import {
  Bot,
  ImagePlus,
  Send,
  Sparkles,
  User,
  Wrench,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  InputGroup,
  InputGroupInput,
  InputGroupAddon,
} from "@/components/ui/input-group"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"
import { downscaleImage } from "@/lib/image-utils"
import {
  AgentProductCarousel,
  type AgentProduct,
} from "./agent-product-carousel"

const SUGGESTIONS = [
  "¿Conviene regar hoy en Mendoza?",
  "Resumime el estado de mis plantas",
  "Buscame fertilizante para potus barato",
  "Adjuntame foto de hoja con manchitas",
]

/**
 * Imagen pendiente a enviar con el próximo mensaje. Vive sólo en cliente y
 * en estado, NO se sube a Blob: la mandamos como data URL al modelo y se
 * descarta apenas el mensaje sale.
 */
type PendingImage = {
  dataUrl: string
  mediaType: string
}

export function ChatPanel({ initialPrompt }: { initialPrompt?: string }) {
  const [input, setInput] = useState("")
  const [pendingImage, setPendingImage] = useState<PendingImage | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
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

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    // Limpiamos el input para que el usuario pueda re-elegir la misma foto
    // si por algún motivo la quita y la quiere volver a poner.
    e.target.value = ""
    if (!file) return
    if (!file.type.startsWith("image/")) return

    const reader = new FileReader()
    reader.onload = async () => {
      const original = reader.result as string
      // Bajamos resolución igual que en el escáner: visión barata y rápida.
      const compressed = await downscaleImage(original, 1024, 0.8)
      setPendingImage({ dataUrl: compressed, mediaType: "image/jpeg" })
    }
    reader.readAsDataURL(file)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (isStreaming) return
    const trimmed = input.trim()
    // Permitimos mandar SOLO imagen (sin texto): es válido para "qué le pasa
    // a esta planta?". Igual sumamos un texto por defecto si vino vacío para
    // que el modelo tenga algo a lo que responder.
    if (!trimmed && !pendingImage) return

    const text = trimmed || (pendingImage ? "¿Qué le pasa a esta planta?" : "")

    if (pendingImage) {
      sendMessage({
        text,
        files: [
          {
            type: "file",
            mediaType: pendingImage.mediaType,
            url: pendingImage.dataUrl,
          },
        ],
      })
    } else {
      sendMessage({ text })
    }
    setInput("")
    setPendingImage(null)
  }

  function handleSuggestion(text: string) {
    if (isStreaming) return
    // Una sugerencia con la palabra "adjuntá foto" abre directo el selector,
    // así el usuario entiende que se puede subir imágenes.
    if (text.toLowerCase().includes("adjunta")) {
      fileInputRef.current?.click()
      return
    }
    sendMessage({ text })
  }

  return (
    <div className="flex h-[calc(100dvh-9.5rem)] flex-col">
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-5 pb-[calc(5rem+env(safe-area-inset-bottom))]"
      >
        <div className="mt-[50px] flex flex-col gap-4 py-2 pb-6">
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
                  Reviso el clima, sugiero riegos y diagnostico problemas
                  desde una foto.
                </p>
              </div>
              <div className="flex flex-col items-center gap-2 pt-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => handleSuggestion(s)}
                    className="w-full max-w-xs rounded-2xl border-2 border-border bg-card px-4 py-3 text-center text-sm font-medium shadow-soft transition-colors hover:border-primary/40 hover:bg-secondary/50 active:scale-[0.99]"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {messages.map((m) => (
            <div key={m.id} className="flex flex-col gap-2">
              <MessageBubble message={m} />
              {/* Si el mensaje del asistente disparó searchProducts y ya
                  vino la respuesta, mostramos el carrusel full-width.
                  Va FUERA del bubble para que las cards respiren. */}
              <ProductsFromMessage message={m} />
            </div>
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
        {/* Preview de la imagen pendiente. La mostramos arriba del input para
            que se sienta como un draft que se puede sacar antes de mandar. */}
        {pendingImage ? (
          <div className="mb-2 flex items-center gap-2 rounded-2xl border-2 border-border bg-card p-2">
            <div className="relative size-12 shrink-0 overflow-hidden rounded-xl bg-secondary">
              <Image
                src={pendingImage.dataUrl}
                alt="Adjunto pendiente"
                fill
                sizes="48px"
                className="object-cover"
              />
            </div>
            <p className="flex-1 text-xs leading-tight text-muted-foreground">
              Foto lista para enviar al agente.
              <br />
              <span className="text-foreground/70">
                Va a usar visión para diagnosticar.
              </span>
            </p>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => setPendingImage(null)}
              aria-label="Quitar imagen"
              className="rounded-xl"
            >
              <X className="size-4" aria-hidden="true" />
            </Button>
          </div>
        ) : null}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={handleFileChange}
          aria-hidden="true"
          tabIndex={-1}
        />

        <InputGroup className="rounded-2xl border-2">
          <InputGroupAddon align="inline-start">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              disabled={isStreaming}
              onClick={() => fileInputRef.current?.click()}
              className="rounded-xl"
              aria-label="Adjuntar foto"
            >
              <ImagePlus className="size-4" aria-hidden="true" />
            </Button>
          </InputGroupAddon>
          <InputGroupInput
            placeholder={
              pendingImage
                ? "Contale qué ves o dejá vacío..."
                : "Escribí tu pregunta..."
            }
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isStreaming}
            aria-label="Mensaje al agente"
          />
          <InputGroupAddon align="inline-end">
            <Button
              type="submit"
              size="icon-sm"
              disabled={(!input.trim() && !pendingImage) || isStreaming}
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
          if (
            part.type === "file" &&
            "mediaType" in part &&
            part.mediaType?.startsWith("image/")
          ) {
            // Mostramos el adjunto que el usuario subió (vive como data URL).
            return (
              <div
                key={i}
                className="relative -mx-1 -mt-1 aspect-square w-48 overflow-hidden rounded-2xl bg-background/40"
              >
                <Image
                  src={part.url}
                  alt="Foto adjunta"
                  fill
                  sizes="192px"
                  className="object-cover"
                  unoptimized
                />
              </div>
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

/**
 * Busca dentro de los parts del mensaje un tool-searchProducts con resultado
 * disponible y, si lo encuentra, renderiza el carrusel de productos. Es una
 * extensión visual del bubble: vive como sibling para no romper el max-w
 * del bubble base y poder usar todo el ancho del mensaje.
 */
function ProductsFromMessage({
  message,
}: {
  message: ReturnType<typeof useChat>["messages"][number]
}) {
  // Sólo renderizamos para mensajes del asistente — los del user nunca
  // tienen tool parts.
  if (message.role !== "assistant") return null

  const productPart = message.parts.find(
    (p): p is typeof p & { state: string; output: ProductsToolOutput } =>
      p.type === "tool-searchProducts" &&
      "state" in p &&
      p.state === "output-available" &&
      "output" in p &&
      typeof p.output === "object" &&
      p.output !== null,
  )
  if (!productPart) return null

  const out = productPart.output
  return (
    <AgentProductCarousel
      query={out.query}
      products={out.products ?? []}
    />
  )
}

interface ProductsToolOutput {
  query: string
  products: AgentProduct[]
}

function ToolBadge({ part }: { part: any }) {
  const toolName = part.type.replace(/^tool-/, "")
  const labels: Record<string, string> = {
    getWeatherAlerts: "Consultando clima en vivo",
    getWeatherForecast: "Pidiendo pronóstico de 3 días",
    listUserPlants: "Revisando tu jardín",
    checkWateringSchedule: "Calculando próximo riego",
    searchProducts: "Buscando precios en Mercado Libre",
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
