"use client"

import { Globe } from "lucide-react"
import { useLanguage, type Language } from "@/lib/i18n/context"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"

export function LanguageSettingsCard() {
  const { language, setLanguage, t } = useLanguage()

  return (
    <section className="mx-5 rounded-3xl border-2 border-border bg-card p-5 shadow-soft">
      <div className="mb-4 flex items-center gap-3">
        <span
          aria-hidden="true"
          className="bg-primary text-primary-foreground flex size-11 shrink-0 items-center justify-center rounded-2xl shadow-soft"
        >
          <Globe className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="font-serif text-lg font-bold leading-tight">
            {t("profile", "language")}
          </h3>
          <p className="text-xs leading-relaxed text-muted-foreground text-pretty">
            {language === "es" ? "Elegí en qué idioma querés usar Botanic." : "Choose which language you want to use Botanic in."}
          </p>
        </div>
      </div>

      <RadioGroup
        value={language}
        onValueChange={(val) => setLanguage(val as Language)}
        className="flex flex-col gap-2"
      >
        <div className="flex items-center space-x-2 rounded-xl border border-border p-3 transition-colors hover:bg-secondary/40">
          <RadioGroupItem value="es" id="lang-es" />
          <Label htmlFor="lang-es" className="flex-1 cursor-pointer font-semibold">
            {t("profile", "language_es")}
          </Label>
        </div>
        <div className="flex items-center space-x-2 rounded-xl border border-border p-3 transition-colors hover:bg-secondary/40">
          <RadioGroupItem value="en" id="lang-en" />
          <Label htmlFor="lang-en" className="flex-1 cursor-pointer font-semibold">
            {t("profile", "language_en")}
          </Label>
        </div>
      </RadioGroup>
    </section>
  )
}
