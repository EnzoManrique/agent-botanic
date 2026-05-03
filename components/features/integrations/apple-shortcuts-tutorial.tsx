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
          <Steps origin={origin} />
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

function Steps({ origin }: { origin: string }) {
  return (
    <ol className="flex flex-col gap-3">
      <Step
        number={1}
        title="Creá un atajo nuevo"
        body="Abrí la app Atajos en tu iPhone (tiene un ícono violeta). Tocá el botón + arriba a la derecha. Luego tocá “Agregar acción”, buscá URL y elegí “Obtener contenido de URL”."
      />

      <Step
        number={2}
        title="Elegí un comando y pegá la dirección"
        body="Botanic tiene 3 comandos. Elegí el que más te guste y pegalo en el campo URL de tu nuevo atajo."
      >
        <div className="flex flex-col gap-3 mt-1">
          <div className="rounded-xl border border-border p-3 bg-card/50 shadow-sm">
            <h5 className="font-bold text-sm mb-1 text-primary">💧 ¿Qué riego hoy?</h5>
            <p className="text-xs text-muted-foreground mb-2">Siri te dirá qué plantas necesitan agua hoy.</p>
            <CopyBlock value={`${origin}/api/voice?q=regar`} label="URL para Riego" />
          </div>

          <div className="rounded-xl border border-border p-3 bg-card/50 shadow-sm">
            <h5 className="font-bold text-sm mb-1 text-primary">🌤️ Clima y Alertas</h5>
            <p className="text-xs text-muted-foreground mb-2">Siri te avisará si hay riesgo para tus plantas.</p>
            <CopyBlock value={`${origin}/api/voice?q=clima`} label="URL para Clima" />
          </div>

          <div className="rounded-xl border border-border p-3 bg-card/50 shadow-sm">
            <h5 className="font-bold text-sm mb-1 text-primary">🌿 Resumen del Jardín</h5>
            <p className="text-xs text-muted-foreground mb-2">Siri te dirá cuántas plantas tenés guardadas.</p>
            <CopyBlock value={`${origin}/api/voice?q=plantas`} label="URL para Resumen" />
          </div>
        </div>
      </Step>

      <Step
        number={3}
        title="Dale permiso a Siri (tu llave secreta)"
        body="Tocá la flechita ▸ (opciones avanzadas) al lado del campo URL. Bajá hasta “Encabezados” y tocá “Agregar nuevo encabezado”."
      >
        <CopyBlock
          value="Authorization"
          label="1. Pegá esto donde dice 'Clave' o 'Key'"
        />
        <CopyBlock
          value="Bearer botanic_TU_TOKEN_ACA"
          label="2. Pegá esto donde dice 'Texto' o 'Value'"
        />
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground text-pretty">
          Ojo: reemplazá <strong>botanic_TU_TOKEN_ACA</strong> por el token que generaste más arriba, dejando el espacio después de Bearer.
        </p>
      </Step>

      <Step
        number={4}
        title="Hacé que Siri hable"
        body="Volvé a tocar “Agregar acción” abajo de todo, buscá Hablar y elegí “Hablar texto”."
      />

      <Step
        number={5}
        title="Ponele nombre y guardalo"
        body="Tocá el nombre arriba de todo y ponele algo como “Mis plantas”. Ese es el nombre mágico que le vas a decir a Siri. ¡Tocá Listo y ya está!"
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
