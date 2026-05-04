"use client"

import { useEffect, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Bot,
  Check,
  ChevronRight,
  Copy,
  ExternalLink,
  Key,
  Loader2,
  MessageCircle,
  Mic,
  Plus,
  Smartphone,
  Speaker,
  Terminal,
  Trash2,
  Zap,
} from "lucide-react"
import { toast } from "sonner"
import { ScreenHeader } from "@/components/mobile/screen-header"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { Input } from "@/components/ui/input"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { cn } from "@/lib/utils"
import {
  createMcpTokenAction,
  deleteMcpTokenAction,
  loadMcpTokensAction,
} from "@/lib/actions/mcp-tokens"
import type { McpTokenRow } from "@/lib/db/mcp-tokens"
import { AppleShortcutsTutorial } from "./integrations/apple-shortcuts-tutorial"
import { DeveloperTutorial } from "./integrations/developer-tutorial"
import { ClaudeDesktopTutorial } from "./integrations/claude-desktop-tutorial"
import { useLanguage } from "@/lib/i18n/context"

/** Id del nodo de la sección de tokens — lo usamos para scrollear desde el
 *  tutorial cuando el usuario tiene que volver a generar uno. */
const TOKENS_SECTION_ID = "tokens-section"

interface Props {
  initialTokens: McpTokenRow[]
}

/**
 * Pantalla "Integraciones" — el showcase del MCP server.
 *
 * Estructura:
 *   1. Header con back.
 *   2. Hero explicando qué es MCP en una línea.
 *   3. Endpoint card: URL pública del server + curl ejemplo.
 *   4. Tokens manager: listar / crear / borrar.
 *   5. Plataformas compatibles: cards con estado.
 */
export function IntegrationsView({ initialTokens }: Props) {
  const router = useRouter()
  const [tokens, setTokens] = useState(initialTokens)
  const [origin, setOrigin] = useState("https://tu-dominio.vercel.app")
  const { language } = useLanguage()

  /** Tutorial activo en el drawer, o null si no hay ninguno abierto. */
  const [activeTutorial, setActiveTutorial] = useState<TutorialKey | null>(
    null,
  )

  // Calculamos el origin real solo en cliente — para que cada usuario vea
  // su propio dominio (preview, prod o localhost) sin que el server tenga
  // que adivinarlo. SSR muestra el placeholder y el cliente lo reemplaza.
  useEffect(() => {
    setOrigin(window.location.origin)
  }, [])

  function handleBack() {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back()
    } else {
      router.push("/perfil")
    }
  }

  async function refreshTokens() {
    try {
      const fresh = await loadMcpTokensAction()
      setTokens(fresh)
    } catch (err) {
      console.error("[v0] refreshTokens:", err)
    }
  }

  /** Cuando el usuario pide crear token desde el tutorial: cerramos el
   *  drawer y scrolleamos a la sección de tokens. */
  function handleRequestCreateToken() {
    if (typeof document === "undefined") return
    requestAnimationFrame(() => {
      const node = document.getElementById(TOKENS_SECTION_ID)
      if (node) node.scrollIntoView({ behavior: "smooth", block: "start" })
    })
  }

  return (
    <div className="mt-[25px] flex flex-col gap-5 pb-4">
      <ScreenHeader
        eyebrow={language === "en" ? "Configuration" : "Configuración"}
        title={language === "en" ? "Integrations" : "Integraciones"}
        subtitle={language === "en" ? "Connect Botanic with your devices." : "Conectá Botanic con tus dispositivos."}
        icon={<ArrowLeft className="size-5" aria-hidden="true" />}
        onIconClick={handleBack}
        iconLabel={language === "en" ? "Back" : "Volver"}
      />

      <HeroExplainer language={language} />
      <EndpointCard origin={origin} language={language} />
      <TokensSection
        tokens={tokens}
        onChange={refreshTokens}
        origin={origin}
        language={language}
      />
      <PlatformsSection onOpenTutorial={setActiveTutorial} language={language} />

      {/* Drawer del tutorial — controlado desde activeTutorial. Sólo
          tenemos uno abierto a la vez. */}
      <AppleShortcutsTutorial
        open={activeTutorial === "apple-shortcuts"}
        onOpenChange={(open) => setActiveTutorial(open ? "apple-shortcuts" : null)}
        origin={origin}
        hasToken={tokens.length > 0}
        onRequestCreateToken={handleRequestCreateToken}
      />
      <DeveloperTutorial
        open={activeTutorial === "developer"}
        onOpenChange={(open) => setActiveTutorial(open ? "developer" : null)}
        origin={origin}
      />
      <ClaudeDesktopTutorial
        open={activeTutorial === "claude-desktop"}
        onOpenChange={(open) => setActiveTutorial(open ? "claude-desktop" : null)}
        origin={origin}
      />
    </div>
  )
}

type TutorialKey = "apple-shortcuts" | "developer" | "claude-desktop"

// ---------- Hero ----------

function HeroExplainer({ language }: { language: string }) {
  return (
    <section className="mx-5 rounded-3xl border-2 border-border bg-card p-5 shadow-soft">
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className="bg-primary text-primary-foreground flex size-11 shrink-0 items-center justify-center rounded-2xl shadow-soft"
        >
          <Zap className="size-5" />
        </span>
        <div className="flex-1">
          <h2 className="font-serif text-lg leading-tight font-bold">
            {language === "en" ? "Your botanical agent, anywhere" : "Tu agente botánico, en cualquier lugar"}
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground text-pretty">
            {language === "en" 
              ? "Botanic exposes your data and tools via MCP (Model Context Protocol), the open standard any AI agent can consume. Generate a token and connect it wherever you want."
              : "Botanic expone tus datos y herramientas vía MCP (Model Context Protocol), el estándar abierto que cualquier agente IA puede consumir. Generá un token y conectalo donde quieras."}
          </p>
        </div>
      </div>
    </section>
  )
}

// ---------- Endpoint card ----------

function EndpointCard({ origin, language }: { origin: string, language: string }) {
  const endpoint = `${origin}/api/mcp`
  const exampleCurl = `curl -X POST ${endpoint} \\
  -H "Authorization: Bearer TU_TOKEN_ACA" \\
  -H "Content-Type: application/json" \\
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'`

  return (
    <section className="mx-5 flex flex-col gap-3 rounded-3xl border-2 border-border bg-card p-5 shadow-soft">
      <div className="flex items-center gap-2">
        <Terminal className="text-primary size-4" aria-hidden="true" />
        <h2 className="font-serif text-base font-bold">{language === "en" ? "Your MCP endpoint" : "Tu endpoint MCP"}</h2>
      </div>

      <div>
        <p className="mb-1.5 text-xs font-semibold text-muted-foreground">
          {language === "en" ? "Server URL" : "URL del server"}
        </p>
        <CopyableBlock value={endpoint} mono language={language} />
      </div>

      <div>
        <p className="mb-1.5 text-xs font-semibold text-muted-foreground">
          {language === "en" ? "Example (curl)" : "Ejemplo (curl)"}
        </p>
        <CopyableBlock value={exampleCurl} mono multiline language={language} />
      </div>

      <div className="mt-1 flex flex-wrap gap-1.5">
        {[
          "list_plants",
          "get_watering_today",
          "get_weather_alerts",
          "get_plant_care_tips",
          "search_products",
        ].map((tool) => (
          <span
            key={tool}
            className="bg-secondary text-foreground inline-flex items-center rounded-full border border-border px-2.5 py-0.5 font-mono text-[11px] font-medium"
          >
            {tool}
          </span>
        ))}
      </div>
    </section>
  )
}

// ---------- Tokens section ----------

function TokensSection({
  tokens,
  onChange,
  origin,
  language
}: {
  tokens: McpTokenRow[]
  onChange: () => Promise<void>
  origin: string
  language: string
}) {
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState("")
  const [pending, startTransition] = useTransition()
  const [revealed, setRevealed] = useState<{
    plaintext: string
    name: string
  } | null>(null)
  const [pendingDelete, setPendingDelete] = useState<McpTokenRow | null>(null)

  function handleCreate() {
    if (pending) return
    const trimmed = name.trim()
    if (!trimmed) {
      toast.error("Ponele un nombre, así después lo identificás.")
      return
    }
    startTransition(async () => {
      const fd = new FormData()
      fd.set("name", trimmed)
      const result = await createMcpTokenAction(fd)
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      setRevealed({ plaintext: result.plaintext, name: result.row.name })
      setName("")
      setCreating(false)
      await onChange()
    })
  }

  function handleConfirmDelete() {
    if (!pendingDelete) return
    const id = pendingDelete.id
    startTransition(async () => {
      const result = await deleteMcpTokenAction(id)
      setPendingDelete(null)
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      toast.success("Token revocado.")
      await onChange()
    })
  }

  return (
    <section
      id={TOKENS_SECTION_ID}
      className="mx-5 flex flex-col gap-3 rounded-3xl border-2 border-border bg-card p-5 shadow-soft scroll-mt-4"
    >
      <header className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Key className="text-primary size-4" aria-hidden="true" />
          <h2 className="font-serif text-base font-bold">
            {language === "en" ? "Access tokens" : "Tokens de acceso"}
          </h2>
        </div>
        {!creating && !revealed ? (
          <Button
            type="button"
            size="sm"
            onClick={() => setCreating(true)}
            className="rounded-xl"
          >
            <Plus className="size-3.5" aria-hidden="true" />
            {language === "en" ? "New" : "Nuevo"}
          </Button>
        ) : null}
      </header>

      <p className="text-xs leading-relaxed text-muted-foreground">
        {language === "en" ? "Each token authenticates the client with your account. The full secret is only shown once." : "Cada token autentica al cliente con tu cuenta. El secret completo sólo se muestra una vez."}
      </p>

      {revealed ? (
        <div className="flex flex-col gap-2 rounded-2xl border-2 border-primary/40 bg-primary/5 p-3">
          <p className="text-xs font-semibold text-primary">
            {language === "en" ? "Save it now — we won't be able to show it again." : "Guardalo ahora — no lo vamos a poder volver a mostrar."}
          </p>
          <CopyableBlock value={revealed.plaintext} mono language={language} />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setRevealed(null)}
            className="self-end rounded-xl"
          >
            {language === "en" ? "I saved it" : "Ya lo guardé"}
          </Button>
        </div>
      ) : null}

      {creating ? (
        <div className="flex flex-col gap-2 rounded-2xl border-2 border-border bg-secondary/50 p-3">
          <label
            htmlFor="token-name"
            className="text-xs font-semibold text-foreground"
          >
            {language === "en" ? "Token name" : "Nombre del token"}
          </label>
          <Input
            id="token-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={language === "en" ? "E.g. Apple Shortcuts on my iPhone" : "Ej. Apple Shortcuts en mi iPhone"}
            maxLength={60}
            className="rounded-xl"
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setCreating(false)
                setName("")
              }}
              className="rounded-xl"
            >
              {language === "en" ? "Cancel" : "Cancelar"}
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleCreate}
              disabled={pending || !name.trim()}
              className="rounded-xl"
            >
              {pending ? (
                <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
              ) : (
                <Check className="size-3.5" aria-hidden="true" />
              )}
              {language === "en" ? "Generate" : "Generar"}
            </Button>
          </div>
        </div>
      ) : null}

      <ul className="flex flex-col gap-2">
        {tokens.length === 0 ? (
          <li className="rounded-2xl border-2 border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
            {language === "en" ? "No tokens yet." : "Sin tokens todavía."}
            <br />
            <span className="text-xs">{language === "en" ? "Generate one to start." : "Generá uno para empezar."}</span>
          </li>
        ) : (
          tokens.map((t) => (
            <li
              key={t.id}
              className="flex items-center gap-3 rounded-2xl border-2 border-border bg-card p-3"
            >
              <span
                aria-hidden="true"
                className="bg-secondary flex size-9 shrink-0 items-center justify-center rounded-xl"
              >
                <Key className="text-primary size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold leading-tight">
                  {t.name}
                </p>
                <p className="font-mono text-[11px] text-muted-foreground">
                  {t.prefix}…
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {t.lastUsedAt
                    ? (language === "en" ? `Last used: ${formatDate(t.lastUsedAt, language)}` : `Último uso: ${formatDate(t.lastUsedAt, language)}`)
                    : (language === "en" ? "Unused" : "Sin usar todavía")}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => setPendingDelete(t)}
                aria-label={`Revocar ${t.name}`}
                className="rounded-xl text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="size-4" aria-hidden="true" />
              </Button>
            </li>
          ))
        )}
      </ul>

      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{language === "en" ? "Revoke this token?" : "¿Revocar este token?"}</AlertDialogTitle>
            <AlertDialogDescription>
              {language === "en" ? "The client using it will lose access immediately. This action cannot be undone." : "El cliente que lo esté usando va a perder acceso al instante. Esta acción no se puede deshacer."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{language === "en" ? "Cancel" : "Cancelar"}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {language === "en" ? "Revoke" : "Revocar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Sutil: link a docs externas para el dev curioso. Como por ahora no
          tenemos docs propias, linkeamos a la spec oficial de MCP. */}
      <a
        href="https://modelcontextprotocol.io/"
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary inline-flex items-center gap-1 self-start text-xs font-medium hover:underline"
      >
        Aprender más sobre MCP
        <ExternalLink className="size-3" aria-hidden="true" />
      </a>

      {/* Aviso accesible para que screen readers entiendan el origin actual. */}
      <span className="sr-only">Tu endpoint actual es {origin}/api/mcp</span>
    </section>
  )
}

// ---------- Platforms section ----------

function PlatformsSection({
  onOpenTutorial,
  language,
}: {
  onOpenTutorial: (key: TutorialKey) => void
  language: string
}) {
  const PLATFORMS: PlatformCardData[] = [
    {
      name: language === "en" ? "For developers" : "Para developers",
      description: language === "en" ? "Any app or script that can speak HTTP+JSON can connect today. Check the curl example above." : "Cualquier app o script que pueda hablar HTTP+JSON puede conectarse hoy. Mirá el ejemplo curl arriba.",
      icon: Terminal,
      status: "live",
      tutorial: "developer",
    },
    {
      name: "Claude Desktop",
      description: language === "en" ? "Paste the MCP endpoint in Claude config and you will be able to ask Claude about your garden." : "Pegá el endpoint MCP en la config de Claude y vas a poder preguntarle a Claude por tu jardín.",
      icon: Bot,
      status: "live",
      tutorial: "claude-desktop",
    },
    {
      name: "Apple Shortcuts",
      description: language === "en" ? "Make Siri tell you which plants to water today. Tap to see the step-by-step tutorial." : "Hacé que Siri te diga qué plantas regar hoy. Tocá para ver el tutorial paso a paso.",
      icon: Smartphone,
      status: "live",
      tutorial: "apple-shortcuts",
    },
    {
      name: "WhatsApp Bot",
      description: language === "en" ? "Message Botanic to ask what to water tomorrow or recommend a fertilizer. In development." : "Pedile a Botanic por mensaje qué regar mañana o que te recomiende un fertilizante. En desarrollo.",
      icon: MessageCircle,
      status: "soon",
    },
    {
      name: "Google Home",
      description: language === "en" ? "“Hey Google, what should I water today?”. Coming soon, native integration." : "“Hey Google, ¿qué tengo que regar hoy?”. Próximamente, integración nativa.",
      icon: Speaker,
      status: "soon",
    },
    {
      name: "Alexa",
      description: language === "en" ? "Alexa Skill to check your garden and weather alerts via voice. Coming soon." : "Skill de Alexa para consultar tu jardín y alertas climáticas con voz. Próximamente.",
      icon: Mic,
      status: "soon",
    },
  ]

  return (
    <section className="mx-5 flex flex-col gap-3">
      <header>
        <h2 className="font-serif text-lg font-bold leading-tight">
          {language === "en" ? "Compatible Platforms" : "Plataformas compatibles"}
        </h2>
        <p className="text-xs text-muted-foreground">
          {language === "en" ? "Connect Botanic with the tool you already use every day." : "Conectá Botanic con la herramienta donde ya hablás todos los días."}
        </p>
      </header>
      <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {PLATFORMS.map((p) => (
          <PlatformCard
            key={p.name}
            platform={p}
            onOpenTutorial={onOpenTutorial}
          />
        ))}
      </ul>
    </section>
  )
}

interface PlatformCardData {
  name: string
  description: string
  icon: typeof Terminal
  status: "live" | "soon"
  /** Si está seteado, la card es clickable y abre el tutorial correspondiente. */
  tutorial?: TutorialKey
}

function PlatformCard({
  platform,
  onOpenTutorial,
}: {
  platform: PlatformCardData
  onOpenTutorial: (key: TutorialKey) => void
}) {
  const { language } = useLanguage()
  const { icon: Icon, status, name, description, tutorial } = platform
  const isLive = status === "live"
  const hasTutorial = Boolean(tutorial)

  // Cuando hay tutorial, la card entera es un botón. Cuando no, es un
  // <li> visual estático (con opacity reducida si está "Pronto").
  const Inner = (
    <>
      <div className="flex items-center justify-between gap-2">
        <span
          aria-hidden="true"
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-xl",
            isLive
              ? "bg-primary/10 text-primary"
              : "bg-secondary text-muted-foreground",
          )}
        >
          <Icon className="size-4" />
        </span>
        <span
          className={cn(
            "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold",
            isLive
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-muted-foreground border border-border",
          )}
        >
          {isLive ? (language === "en" ? "Live" : "Disponible") : (language === "en" ? "Soon" : "Pronto")}
        </span>
      </div>
      <h3 className="font-serif text-sm font-bold leading-tight">{name}</h3>
      <p className="text-xs leading-snug text-muted-foreground text-pretty">
        {description}
      </p>
      {hasTutorial ? (
        <span className="text-primary mt-1 inline-flex items-center gap-1 text-xs font-semibold">
          {language === "en" ? "View tutorial" : "Ver tutorial"}
          <ChevronRight className="size-3.5" aria-hidden="true" />
        </span>
      ) : null}
    </>
  )

  if (hasTutorial && tutorial) {
    return (
      <li className="contents">
        <button
          type="button"
          onClick={() => onOpenTutorial(tutorial)}
          className={cn(
            "flex flex-col gap-2 rounded-2xl border-2 border-border bg-card p-4 text-left shadow-soft transition-colors",
            "hover:border-primary/60 hover:bg-secondary/30",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
          )}
          aria-label={`Abrir tutorial de ${name}`}
        >
          {Inner}
        </button>
      </li>
    )
  }

  return (
    <li
      className={cn(
        "flex flex-col gap-2 rounded-2xl border-2 border-border bg-card p-4 shadow-soft transition-colors",
        isLive ? "hover:border-primary/40" : "opacity-80",
      )}
    >
      {Inner}
    </li>
  )
}

// ---------- Helpers ----------

function CopyableBlock({
  value,
  mono = false,
  multiline = false,
  language = "es",
}: {
  value: string
  mono?: boolean
  multiline?: boolean
  language?: string
}) {
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
    <div className="bg-secondary/60 group relative flex items-start gap-2 rounded-xl border border-border p-2.5 pr-10">
      <pre
        className={cn(
          "flex-1 overflow-x-auto whitespace-pre text-[11px] leading-relaxed",
          mono && "font-mono",
          !multiline && "whitespace-nowrap",
        )}
      >
        {value}
      </pre>
      <button
        type="button"
        onClick={handleCopy}
        aria-label="Copiar"
        className={cn(
          "absolute top-2 right-2 inline-flex size-7 items-center justify-center rounded-lg border border-border bg-card transition-colors",
          "hover:bg-secondary",
        )}
      >
        {copied ? (
          <Check
            className="text-primary size-3.5"
            aria-hidden="true"
          />
        ) : (
          <Copy className="text-muted-foreground size-3.5" aria-hidden="true" />
        )}
      </button>
    </div>
  )
}

function formatDate(iso: string, language: string = "es"): string {
  try {
    return new Date(iso).toLocaleString(language === "en" ? "en-US" : "es-AR", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    })
  } catch {
    return iso
  }
}
