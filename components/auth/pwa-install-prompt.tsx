"use client"

import { useEffect, useState } from "react"
import { Download, X, Share } from "lucide-react"
import { Button } from "@/components/ui/button"

export function PwaInstallPrompt() {
  const [isInstallable, setIsInstallable] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showPrompt, setShowPrompt] = useState(false)

  useEffect(() => {
    // 1. Si ya está instalado (standalone mode) o el usuario lo cerró, no mostramos nada
    if (
      window.matchMedia("(display-mode: standalone)").matches ||
      localStorage.getItem("pwaPromptDismissed") === "true"
    ) {
      return
    }

    // 2. Detectar iOS (no soporta beforeinstallprompt nativo)
    const isIosDevice =
      /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
    
    // En Safari de iOS no hay un evento de instalación que podamos atrapar,
    // pero podemos sugerirle que use el botón de compartir.
    if (isIosDevice) {
      setIsIOS(true)
      setIsInstallable(true)
      // Damos un segundo de delay para que no sea tan invasivo apenas carga
      const timer = setTimeout(() => setShowPrompt(true), 1500)
      return () => clearTimeout(timer)
    }

    // 3. Detectar navegadores que soportan PWA de forma estándar (Chrome, Edge, etc en Android)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault() // Evita que Chrome muestre el mini-infobar automático (opcional, pero da más control)
      setDeferredPrompt(e)
      setIsInstallable(true)
      setShowPrompt(true)
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    // Muestra el prompt nativo de instalación
    deferredPrompt.prompt()
    
    // Espera a ver qué decide el usuario
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === "accepted") {
      setShowPrompt(false)
    }
    
    // Una vez usado el prompt, ya no se puede volver a usar
    setDeferredPrompt(null)
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    localStorage.setItem("pwaPromptDismissed", "true")
  }

  if (!showPrompt || !isInstallable) return null

  return (
    <div className="fixed bottom-0 left-1/2 z-50 w-full max-w-md -translate-x-1/2 animate-in slide-in-from-bottom-5 fade-in duration-300">
      <div className="m-4 flex flex-col gap-3 rounded-2xl border-2 border-primary/20 bg-card p-4 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-1 items-start gap-3">
            <div
              className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-soft"
              aria-hidden="true"
            >
              <Download className="size-5" />
            </div>
            <div className="space-y-1">
              <h3 className="font-serif text-base font-semibold leading-none">
                Instalá la App
              </h3>
              {isIOS ? (
                <p className="text-xs text-muted-foreground leading-relaxed text-pretty">
                  Para una mejor experiencia, tocá el ícono de <Share className="inline size-3 pb-[1px]" /> compartir y luego elegí <strong className="font-semibold text-foreground">"Agregar a Inicio"</strong>.
                </p>
              ) : (
                <p className="text-xs text-muted-foreground leading-relaxed text-pretty">
                  Instalá Secretary Botanic en tu inicio para usarla como una app nativa, más rápida y a pantalla completa.
                </p>
              )}
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-muted-foreground hover:bg-secondary flex size-8 items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label="Cerrar aviso"
          >
            <X className="size-4" />
          </button>
        </div>
        
        {!isIOS && (
          <Button 
            onClick={handleInstallClick} 
            className="w-full rounded-xl font-semibold"
          >
            Instalar App
          </Button>
        )}
      </div>
    </div>
  )
}
