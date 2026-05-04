"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import {
  Bot,
  Cloud,
  CloudHail,
  ImagePlus,
  Leaf,
  Scan,
  Send,
  ShoppingBag,
  Sparkles,
  Sprout,
  User,
  Wrench,
  X,
  type LucideIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  InputGroup,
  InputGroupInput,
  InputGroupAddon,
} from "@/components/ui/input-group"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { downscaleImage } from "@/lib/image-utils"
import { humanizeAiError, isOverloadError } from "@/lib/ai-retry"
import {
  AgentProductCarousel,
  type AgentProduct,
} from "./agent-product-carousel"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

/** Sugerencias del empty state. Cada una representa una capacidad distinta
 *  del agente para que el usuario descubra todo lo que puede pedirle:
 *  clima, estado del jardín, alertas, productos, diagnóstico por foto y
 *  consejos generales de cuidado. Si agregamos una herramienta nueva al
 *  agente, sumá un chip acá para que sea descubrible. */
type Suggestion = {
  icon: LucideIcon
  label: string
  /** Texto que se manda al modelo cuando el usuario toca el chip. */
  prompt: string
}

const getSuggestions = (t: any) => [
  {
    icon: Cloud,
    label: t("agent", "sugg_1") || "¿Conviene regar hoy?",
    prompt: t("agent", "sugg_1_prompt") || "¿Conviene regar hoy según el clima de mi ciudad?",
  },
  {
    icon: Sprout,
    label: t("agent", "sugg_2") || "¿Cómo está mi jardín?",
    prompt: t("agent", "sugg_2_prompt") || "Resumime el estado de mis plantas y qué necesita atención.",
  },
  {
    icon: Scan,
    label: t("agent", "sugg_3") || "Diagnosticar por foto",
    prompt: t("agent", "sugg_3_prompt") || "Te voy a adjuntar una foto de una hoja con manchas — decime qué tiene y cómo lo soluciono.",
  },
  {
    icon: ShoppingBag,
    label: t("agent", "sugg_4") || "Buscar fertilizante",
    prompt: t("agent", "sugg_4_prompt") || "Buscame opciones de fertilizante para potus en Mercado Libre.",
  },
  {
    icon: CloudHail,
    label: t("agent", "sugg_5") || "¿Hay alerta esta semana?",
    prompt: t("agent", "sugg_5_prompt") || "¿Hay riesgo de granizo, helada o viento fuerte esta semana?",
  },
  {
    icon: Leaf,
    label: t("agent", "sugg_6") || "Consejos de cuidado",
    prompt: t("agent", "sugg_6_prompt") || "¿Cómo cuido una suculenta en interior durante el invierno mendocino?",
  },
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

import { useLanguage } from "@/lib/i18n/context"

export function ChatPanel({ initialPrompt }: { initialPrompt?: string }) {
  const { language, t } = useLanguage()
  const [input, setInput] = useState("")
  const [pendingImage, setPendingImage] = useState<PendingImage | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const initialPromptSent = useRef(false)
  const retryAttemptedRef = useRef(false)

  const { messages, sendMessage, regenerate, status } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
    body: { language },
    // Estrategia de errores en 2 niveles:
    //  1. Si es saturación transitoria del modelo (high demand, 503, 429,
    //     timeout) hacemos UN auto-retry silencioso después de 2s. La
    //     usuaria ni se entera — ve un breve "..." extra y la respuesta
    //     llega normal. Esto cubre el 80% de los fallos en horario pico.
    //  2. Si el retry también falla, o si es un error real (auth, red,
    //     filtro de seguridad), recién ahí mostramos toast.
    onError: (err) => {
      console.error("[v0] Error en chat:", err)
      if (isOverloadError(err) && !retryAttemptedRef.current) {
        retryAttemptedRef.current = true
        console.log("[v0] Modelo saturado, reintentando en 2s...")
        setTimeout(() => {
          // regenerate() reintenta la última respuesta del asistente sin
          // duplicar el mensaje del usuario en el historial.
          regenerate().catch((retryErr) => {
            console.error("[v0] Retry falló:", retryErr)
            toast.error(humanizeAiError(retryErr))
          })
        }, 2000)
        return
      }
      toast.error(humanizeAiError(err))
    },
  })

  // Cuando una respuesta termina exitosamente, reseteamos el flag de retry
  // para que el próximo error tenga su oportunidad de reintento.
  useEffect(() => {
    if (status === "ready") {
      retryAttemptedRef.current = false
    }
  }, [status])

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
                  {t("agent", "greeting") || "Hola, ¿en qué te ayudo?"}
                </p>
                <p className="mt-1 text-sm text-muted-foreground text-pretty">
                  {t("agent", "greeting_desc") || "Reviso el clima, cuido tu jardín, busco productos y diagnostico problemas desde una foto."}
                </p>
              </div>
              {/* Grid de capacidades. En mobile mostramos 1 columna a ancho
                  completo; en pantallas un poco más anchas pasamos a 2
                  columnas para que se vea todo el alcance del agente sin
                  scrollear. Cada chip lleva su ícono propio para que la
                  capacidad sea reconocible de un vistazo. */}
              <ul className="grid grid-cols-1 gap-2 pt-2 sm:grid-cols-2">
                {getSuggestions(t).map(({ icon: Icon, label, prompt }) => (
                  <li key={label} className="contents">
                    <button
                      type="button"
                      onClick={() => handleSuggestion(prompt)}
                      className="flex w-full items-center gap-3 rounded-2xl border-2 border-border bg-card px-3.5 py-3 text-left text-sm font-medium shadow-soft transition-colors hover:border-primary/40 hover:bg-secondary/50 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                      <span
                        aria-hidden="true"
                        className="bg-primary/10 text-primary flex size-8 shrink-0 items-center justify-center rounded-xl"
                      >
                        <Icon className="size-4" />
                      </span>
                      <span className="text-pretty leading-snug">{label}</span>
                    </button>
                  </li>
                ))}
              </ul>
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
              {t("agent", "thinking") || (language === "en" ? "Thinking..." : "Pensando...")}
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
              {t("agent", "photo_ready") || (language === "en" ? "Photo ready to send to agent." : "Foto lista para enviar al agente.")}
              <br />
              <span className="text-foreground/70">
                {t("agent", "vision_desc") || (language === "en" ? "Will use vision to diagnose." : "Va a usar visión para diagnosticar.")}
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
                ? (t("agent", "input_placeholder_photo") || (language === "en" ? "Tell me what you see or leave blank..." : "Contale qué ves o dejá vacío..."))
                : (t("agent", "placeholder") || "Escribí tu pregunta...")
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
              <div key={i} className="text-pretty">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    p: ({ node, ...props }) => <p className="mb-2 last:mb-0 whitespace-pre-wrap" {...props} />,
                    a: ({ node, ...props }) => <a className="text-primary font-medium underline underline-offset-4" target="_blank" rel="noreferrer" {...props} />,
                    strong: ({ node, ...props }) => <strong className="text-foreground font-semibold" {...props} />,
                    ul: ({ node, ...props }) => <ul className="mb-4 ml-4 list-outside list-disc space-y-1" {...props} />,
                    ol: ({ node, ...props }) => <ol className="mb-4 ml-4 list-outside list-decimal space-y-1" {...props} />,
                    li: ({ node, ...props }) => <li className="pl-1" {...props} />,
                    img: ({ node, ...props }) => <img className="border-border my-2 max-w-full rounded-xl border" alt="imagen" {...props} />,
                    h1: ({ node, ...props }) => <h1 className="mb-2 mt-4 text-lg font-bold" {...props} />,
                    h2: ({ node, ...props }) => <h2 className="mb-2 mt-4 text-base font-bold" {...props} />,
                    h3: ({ node, ...props }) => <h3 className="mb-2 mt-4 text-sm font-bold" {...props} />,
                  }}
                >
                  {part.text}
                </ReactMarkdown>
              </div>
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
  const { t } = useLanguage()
  const toolName = part.type.replace(/^tool-/, "")
  const labels: Record<string, string> = {
    getWeatherAlerts: t("agent", "tool_weather") || "Consultando clima en vivo",
    getWeatherForecast: t("agent", "tool_forecast") || "Pidiendo pronóstico de 3 días",
    listUserPlants: t("agent", "tool_garden") || "Revisando tu jardín",
    checkWateringSchedule: t("agent", "tool_watering") || "Calculando próximo riego",
    searchProducts: t("agent", "tool_search") || "Buscando precios en Mercado Libre",
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
      {done ? <span className="text-muted-foreground">· {t("agent", "tool_done") || "listo"}</span> : null}
    </div>
  )
}
