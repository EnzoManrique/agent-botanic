"use client"

import { useState } from "react"
import {
  ArrowDown,
  Check,
  Copy,
  Mic,
  Plus,
  Smartphone,
  Sparkles,
  X,
} from "lucide-react"
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
  /** Origin de la app, ej. "https://agent-botanic.vercel.app". */
  origin: string
  /** Si el usuario ya tiene tokens generados, lo usamos para no pedirle que cree uno. */
  hasToken: boolean
  /** Cuando el usuario toca "Quiero crear un token", cerramos el drawer y avisamos. */
  onRequestCreateToken: () => void
}

/**
 * Tutorial paso a paso para configurar un Atajo de Apple Shortcuts que
 * llame al endpoint /api/voice de Botanic y que Siri lea la respuesta en
 * voz alta.
 *
 * El target son usuarios NO técnicos (mamás, abuelas, gente que jamás
 * tocó una API en su vida). Por eso:
 * - Cero jerga: nada de "endpoint", "header", "JSON" sin explicar.
 * - Bloques copiables grandes con el valor exacto que tienen que pegar.
 * - Lenguaje cercano y argentino ("dale", "tocá", "vas a ver").
 * - Pasos numerados con badges visuales para que sepan dónde están.
 * - El último paso es la frase mágica para Siri, destacada como un trofeo.
 */
export function AppleShortcutsTutorial({
  open,
  onOpenChange,
  origin,
  hasToken,
  onRequestCreateToken,
}: Props) {
  const { language } = useLanguage()
  const voiceUrl = `${origin}/api/voice?q=regar`

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="bg-background max-h-[92vh]">
        {/* Header con cierre — el handle gris del drawer ya está arriba. */}
        <DrawerHeader className="px-5 pt-2 pb-3 text-left">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <span
                aria-hidden="true"
                className="bg-primary text-primary-foreground flex size-12 shrink-0 items-center justify-center rounded-2xl shadow-soft"
              >
                <Smartphone className="size-6" strokeWidth={2.2} />
              </span>
              <div className="flex flex-col gap-1">
                <DrawerTitle className="font-serif text-2xl font-bold leading-tight">
                  {language === "en" ? "Botanic on your iPhone" : "Botanic en tu iPhone"}
                </DrawerTitle>
                <DrawerDescription className="text-sm leading-relaxed text-pretty">
                  {language === "en" ? "Have Siri tell you which plants to water today." : "Hacé que Siri te diga qué plantas regar hoy."}
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

        <div className="overflow-y-auto px-5 pb-8">
          <WhatIsSection language={language} />
          {!hasToken ? (
            <NeedTokenSection
              language={language}
              onCreate={() => {
                onRequestCreateToken()
                onOpenChange(false)
              }}
            />
          ) : null}
          <Steps origin={origin} language={language} />
          <FinalSection language={language} />
        </div>
      </DrawerContent>
    </Drawer>
  )
}

// ---------- Secciones ----------

function WhatIsSection({ language }: { language: string }) {
  return (
    <section className="mb-5 rounded-2xl border-2 border-border bg-secondary/40 p-4">
      <h3 className="mb-1 flex items-center gap-2 font-serif text-base font-bold">
        <Sparkles
          className="text-primary size-4"
          aria-hidden="true"
        />
        {language === "en" ? "What is Shortcuts?" : "¿Qué es Atajos?"}
      </h3>
      <p className="text-sm leading-relaxed text-foreground/80 text-pretty">
        {language === "en" 
          ? "Shortcuts is a free app already installed on your iPhone. It lets you create commands for Siri to do things for you — like telling you which plants need watering today, without opening the Botanic app."
          : "Atajos (en inglés Shortcuts) es una app gratis que ya viene instalada en tu iPhone. Te deja crear comandos para que Siri haga cosas por vos — como contarte qué plantas tenés que regar hoy, sin abrir la app de Botanic."}
      </p>
    </section>
  )
}

function NeedTokenSection({ onCreate, language }: { onCreate: () => void, language: string }) {
  return (
    <section className="mb-5 rounded-2xl border-2 border-primary/40 bg-primary/5 p-4">
      <h3 className="mb-1 font-serif text-base font-bold">
        {language === "en" ? "Before starting: generate a token" : "Antes de empezar: generá un token"}
      </h3>
      <p className="mb-3 text-sm leading-relaxed text-foreground/80 text-pretty">
        {language === "en" ? "It's like a key that gives Siri permission to see your garden. Tap the button, copy it and come back here." : "Es como una llave que le da permiso a Siri de ver tu jardín. Tocá el botón, copialo y volvé acá."}
      </p>
      <Button
        type="button"
        size="sm"
        onClick={onCreate}
        className="rounded-xl"
      >
        <Plus className="size-3.5" aria-hidden="true" />
        {language === "en" ? "Create a token now" : "Crear un token ahora"}
      </Button>
    </section>
  )
}

function Steps({ origin, language }: { origin: string, language: string }) {
  return (
    <ol className="flex flex-col gap-3">
      <Step
        number={1}
        title={language === "en" ? "Create a new shortcut" : "Creá un atajo nuevo"}
        body={language === "en" ? "Open the Shortcuts app. Tap the + button at the top right. Then tap 'Add action', search for the word URL and choose the one that says 'Get Contents of URL'." : "Abrí la app Atajos (ícono violeta). Tocá el botón + arriba a la derecha. Luego tocá “Agregar acción”, buscá la palabra CONTENIDO y elegí la que dice “Obtener contenido de URL”."}
      >
        <p className="mt-2 text-[11px] leading-relaxed text-amber-600 font-medium">
          {language === "en" ? "⚠️ Note: DO NOT choose the one that says 'component', choose the one with the blue or green globe icon." : "⚠️ Ojo: NO elijas la que dice \"componente\", elegí la que tiene el ícono de un globo terráqueo azul o verde."}
        </p>
      </Step>

      <Step
        number={2}
        title={language === "en" ? "Choose a command and paste the address" : "Elegí un comando y pegá la dirección"}
        body={language === "en" ? "Botanic has 3 commands. Choose the one you like best and paste it into the URL field of your new shortcut." : "Botanic tiene 3 comandos. Elegí el que más te guste y pegalo en el campo URL de tu nuevo atajo."}
      >
        <div className="flex flex-col gap-3 mt-1">
          <div className="rounded-xl border border-border p-3 bg-card/50 shadow-sm">
            <h5 className="font-bold text-sm mb-1 text-primary">{language === "en" ? "💧 What to water today?" : "💧 ¿Qué riego hoy?"}</h5>
            <p className="text-xs text-muted-foreground mb-2">{language === "en" ? "Siri will tell you which plants need water today." : "Siri te dirá qué plantas necesitan agua hoy."}</p>
            <CopyBlock value={`${origin}/api/voice?q=regar`} label={language === "en" ? "URL for Watering" : "URL para Riego"} />
          </div>

          <div className="rounded-xl border border-border p-3 bg-card/50 shadow-sm">
            <h5 className="font-bold text-sm mb-1 text-primary">{language === "en" ? "🌤️ Weather and Alerts" : "🌤️ Clima y Alertas"}</h5>
            <p className="text-xs text-muted-foreground mb-2">{language === "en" ? "Siri will notify you of risks for your plants." : "Siri te avisará si hay riesgo para tus plantas."}</p>
            <CopyBlock value={`${origin}/api/voice?q=clima`} label={language === "en" ? "URL for Weather" : "URL para Clima"} />
          </div>

          <div className="rounded-xl border border-border p-3 bg-card/50 shadow-sm">
            <h5 className="font-bold text-sm mb-1 text-primary">{language === "en" ? "🌿 Garden Summary" : "🌿 Resumen del Jardín"}</h5>
            <p className="text-xs text-muted-foreground mb-2">{language === "en" ? "Siri will tell you how many saved plants you have." : "Siri te dirá cuántas plantas tenés guardadas."}</p>
            <CopyBlock value={`${origin}/api/voice?q=plantas`} label={language === "en" ? "URL for Summary" : "URL para Resumen"} />
          </div>
        </div>
      </Step>

      <Step
        number={3}
        title={language === "en" ? "Give Siri permission (your secret key)" : "Dale permiso a Siri (tu llave secreta)"}
        body={language === "en" ? "Tap the blue circle with the arrow (>) right next to the link you pasted. That opens options. Scroll down to 'Headers' and tap 'Add new header' ONLY ONCE." : "Tocá el circulito azul con la flechita (>) que aparece justo al lado del link que pegaste. Eso despliega opciones. Bajá hasta “Encabezados” y tocá “Agregar nuevo encabezado” UNA SOLA VEZ."}
      >
        <div className="mt-2 text-[11px] leading-relaxed text-foreground/80 mb-2">
          {language === "en" ? "In the new line that appears, fill out both fields:" : "En la nueva línea que aparece, llená los dos campos:"}
        </div>
        <CopyBlock
          value="Authorization"
          label={language === "en" ? "1. On the left (Key)" : "1. A la izquierda (Clave / Key)"}
        />
        <CopyBlock
          value="Bearer TU_TOKEN_ACA"
          label={language === "en" ? "2. On the right (Value)" : "2. A la derecha (Texto / Value)"}
        />
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground text-pretty">
          {language === "en" ? "Note: replace TU_TOKEN_ACA with the token you generated above, keeping the space after Bearer." : "Ojo: reemplazá TU_TOKEN_ACA por el token que generaste más arriba, dejando el espacio después de Bearer."}
        </p>
      </Step>

      <Step
        number={4}
        title={language === "en" ? "Make Siri speak" : "Hacé que Siri hable"}
        body={language === "en" ? "Tap 'Add action' at the very bottom again, search for the word SPEAK and choose the one that says 'Speak Text'." : "Volvé a tocar “Agregar acción” abajo de todo, buscá la palabra HABLAR y elegí la que dice “Hablar texto” o “Leer texto”."}
      >
        <p className="mt-2 text-[11px] leading-relaxed text-amber-600 font-medium">
          {language === "en" ? "⚠️ Warning: DO NOT choose 'Dictate text'. It must be the one with the speaker icon." : "⚠️ Cuidado: NO elijas \"Dictar texto\" (eso es para que vos le hables). Tiene que ser la del ícono del parlante."}
        </p>
      </Step>

      <Step
        number={5}
        title={language === "en" ? "Name it and save it" : "Ponele nombre y guardalo"}
        body={language === "en" ? "At the top center of the screen, you will see an automatic name. Tap it, choose 'Rename' and write a short name like 'My plants'. That's the magic name you'll say to Siri! Tap Done and you're finished." : "Arriba de todo, en el medio de la pantalla, vas a ver un nombre automático (tipo 'Obtener contenido...'). Tocalo, elegí 'Renombrar' y escribí un nombre cortito como 'Mis plantas'. ¡Ese es el nombre mágico que le vas a decir a Siri! Tocá Listo y ya terminaste."}
      />
    </ol>
  )
}

function FinalSection({ language }: { language: string }) {
  return (
    <section className="mt-6 rounded-2xl border-2 border-primary/40 bg-primary/5 p-5 text-center">
      <span
        aria-hidden="true"
        className="bg-primary text-primary-foreground mx-auto mb-3 flex size-12 items-center justify-center rounded-2xl shadow-soft"
      >
        <Mic className="size-6" />
      </span>
      <h3 className="mb-2 font-serif text-lg font-bold leading-tight">
        {language === "en" ? "Try it now with Siri" : "Probalo ahora con Siri"}
      </h3>
      <p className="mb-3 text-sm leading-relaxed text-foreground/80 text-pretty">
        {language === "en" ? "Say to your iPhone:" : "Decile al iPhone:"}
      </p>
      <p className="bg-card border-2 border-border rounded-2xl px-4 py-3 font-serif text-base font-bold italic">
        {language === "en" ? "Hey Siri, my plants" : "Hey Siri, mis plantas"}
      </p>
      <p className="mt-3 text-xs leading-relaxed text-muted-foreground text-pretty">
        {language === "en" ? "Siri will run the shortcut and read aloud which plants need watering today. If it says something weird, check that the token is pasted correctly in step 3." : "Siri va a ejecutar el atajo y leerte en voz alta cuáles necesitan riego hoy. Si te dice algo raro, revisá que el token esté bien pegado en el paso 3."}
      </p>
    </section>
  )
}

// ---------- Componentes auxiliares ----------

interface StepProps {
  number: number
  title: string
  body?: string
  children?: React.ReactNode
}

function Step({ number, title, body, children }: StepProps) {
  return (
    <li className="bg-card relative flex gap-3 rounded-2xl border-2 border-border p-4 shadow-soft">
      <span
        aria-hidden="true"
        className="bg-primary text-primary-foreground flex size-8 shrink-0 items-center justify-center rounded-xl font-serif text-base font-bold shadow-soft"
      >
        {number}
      </span>
      <div className="min-w-0 flex-1">
        <h4 className="font-serif text-sm font-bold leading-tight">{title}</h4>
        {body ? (
          <p className="mt-1 text-sm leading-relaxed text-foreground/75 text-pretty">
            {body}
          </p>
        ) : null}
        {children ? <div className="mt-3">{children}</div> : null}
      </div>
      {/* Conector visual entre steps — sutil, solo en mobile */}
      <ArrowDown
        aria-hidden="true"
        className="text-border absolute -bottom-3.5 left-7 size-3 last:hidden"
      />
    </li>
  )
}

function CopyBlock({ value, label }: { value: string; label: string }) {
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
    <div className="mb-2 last:mb-0">
      <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <button
        type="button"
        onClick={handleCopy}
        className={cn(
          "bg-secondary group flex w-full items-center gap-2 rounded-xl border border-border p-2.5 text-left transition-colors",
          "hover:bg-secondary/70 active:bg-secondary",
        )}
        aria-label={`Copiar ${label}`}
      >
        <span className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap font-mono text-xs leading-relaxed">
          {value}
        </span>
        {copied ? (
          <Check
            className="text-primary size-4 shrink-0"
            aria-hidden="true"
          />
        ) : (
          <Copy
            className="text-muted-foreground size-4 shrink-0"
            aria-hidden="true"
          />
        )}
      </button>
    </div>
  )
}
