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
                  Botanic en tu iPhone
                </DrawerTitle>
                <DrawerDescription className="text-sm leading-relaxed text-pretty">
                  Hacé que Siri te diga qué plantas regar hoy.
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
          <WhatIsSection />
          {!hasToken ? (
            <NeedTokenSection
              onCreate={() => {
                onRequestCreateToken()
                onOpenChange(false)
              }}
            />
          ) : null}
          <Steps voiceUrl={voiceUrl} />
          <FinalSection />
        </div>
      </DrawerContent>
    </Drawer>
  )
}

// ---------- Secciones ----------

function WhatIsSection() {
  return (
    <section className="mb-5 rounded-2xl border-2 border-border bg-secondary/40 p-4">
      <h3 className="mb-1 flex items-center gap-2 font-serif text-base font-bold">
        <Sparkles
          className="text-primary size-4"
          aria-hidden="true"
        />
        ¿Qué es Atajos?
      </h3>
      <p className="text-sm leading-relaxed text-foreground/80 text-pretty">
        Atajos (en inglés <em>Shortcuts</em>) es una app gratis que ya viene
        instalada en tu iPhone. Te deja crear comandos para que Siri haga
        cosas por vos — como contarte qué plantas tenés que regar hoy, sin
        abrir la app de Botanic.
      </p>
    </section>
  )
}

function NeedTokenSection({ onCreate }: { onCreate: () => void }) {
  return (
    <section className="mb-5 rounded-2xl border-2 border-primary/40 bg-primary/5 p-4">
      <h3 className="mb-1 font-serif text-base font-bold">
        Antes de empezar: generá un token
      </h3>
      <p className="mb-3 text-sm leading-relaxed text-foreground/80 text-pretty">
        Es como una llave que le da permiso a Siri de ver tu jardín. Tocá
        el botón, copialo y volvé acá.
      </p>
      <Button
        type="button"
        size="sm"
        onClick={onCreate}
        className="rounded-xl"
      >
        <Plus className="size-3.5" aria-hidden="true" />
        Crear un token ahora
      </Button>
    </section>
  )
}

function Steps({ voiceUrl }: { voiceUrl: string }) {
  return (
    <ol className="flex flex-col gap-3">
      <Step
        number={1}
        title="Abrí la app Atajos"
        body="Buscá la app llamada Atajos (en inglés, Shortcuts) en tu iPhone. Tiene un ícono violeta con dos formas geométricas. Si no la encontrás, deslizá el dedo hacia abajo en la pantalla de inicio y escribí “Atajos” en el buscador."
      />

      <Step
        number={2}
        title="Tocá el botón + arriba a la derecha"
        body="Eso crea un atajo nuevo. Te va a abrir una pantalla en blanco con el botón “Agregar acción” en el medio."
      />

      <Step
        number={3}
        title="Buscá la acción “Obtener contenido de URL”"
        body="Tocá “Agregar acción”, escribí URL en el buscador y elegí la opción “Obtener contenido de URL”. Es la que tiene un ícono de globo terráqueo."
      />

      <Step
        number={4}
        title="Pegá esta dirección en el campo URL"
      >
        <CopyBlock value={voiceUrl} label="Dirección de tu jardín" />
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground text-pretty">
          Esa es la dirección donde vive tu jardín. Si querés que el atajo
          te diga otra cosa, podés cambiar el final por{" "}
          <code className="bg-secondary rounded px-1 font-mono text-[10px]">
            ?q=plantas
          </code>{" "}
          o{" "}
          <code className="bg-secondary rounded px-1 font-mono text-[10px]">
            ?q=clima
          </code>
          .
        </p>
      </Step>

      <Step
        number={5}
        title="Tocá la flechita ▸ al lado de “Obtener contenido de URL”"
        body="Eso abre opciones avanzadas. Donde dice “Método” cambialo de GET a GET (ya está así por defecto, no hace falta tocarlo). Después bajá hasta encontrar “Encabezados”."
      />

      <Step
        number={6}
        title="Agregá un encabezado con tu token"
        body='Tocá “Agregar nuevo encabezado”. En “Clave” escribí Authorization. En “Texto” escribí Bearer seguido de un espacio y después tu token (que copiaste antes).'
      >
        <CopyBlock
          value="Authorization"
          label="Clave (Key)"
        />
        <CopyBlock
          value="Bearer botanic_TU_TOKEN_ACA"
          label="Valor (Value)"
        />
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground text-pretty">
          Reemplazá <strong>botanic_TU_TOKEN_ACA</strong> con el token que
          generaste en la sección de arriba.
        </p>
      </Step>

      <Step
        number={7}
        title="Agregá una segunda acción: “Hablar texto”"
        body="Volvé a tocar “Agregar acción” (abajo de todo), buscá Hablar y elegí “Hablar texto”. Esa acción va a leer en voz alta lo que la URL devolvió."
      />

      <Step
        number={8}
        title="Renombrá el atajo"
        body='Tocá el ícono de configuración (la flechita o el nombre de arriba) y poné un nombre claro tipo “Mis plantas” o “Qué riego hoy”. Ese va a ser el nombre que le decís a Siri.'
      />

      <Step
        number={9}
        title="Listo, guardalo"
        body="Tocá “Listo” arriba a la derecha. Tu atajo ya está vivo en tu iPhone."
      />
    </ol>
  )
}

function FinalSection() {
  return (
    <section className="mt-6 rounded-2xl border-2 border-primary/40 bg-primary/5 p-5 text-center">
      <span
        aria-hidden="true"
        className="bg-primary text-primary-foreground mx-auto mb-3 flex size-12 items-center justify-center rounded-2xl shadow-soft"
      >
        <Mic className="size-6" />
      </span>
      <h3 className="mb-2 font-serif text-lg font-bold leading-tight">
        Probalo ahora con Siri
      </h3>
      <p className="mb-3 text-sm leading-relaxed text-foreground/80 text-pretty">
        Decile al iPhone:
      </p>
      <p className="bg-card border-2 border-border rounded-2xl px-4 py-3 font-serif text-base font-bold italic">
        Hey Siri, mis plantas
      </p>
      <p className="mt-3 text-xs leading-relaxed text-muted-foreground text-pretty">
        Siri va a ejecutar el atajo y leerte en voz alta cuáles necesitan
        riego hoy. Si te dice algo raro, revisá que el token esté bien
        pegado en el paso 6.
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
