"use client"

import {
  CloudRain,
  Droplets,
  MapPin,
  Snowflake,
  Sun,
  Thermometer,
  Wind,
} from "lucide-react"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { SettingsSection } from "./settings-section"
import type { TempUnit, UserSettings, WeatherAlertPreferences } from "@/lib/types"
import { cn } from "@/lib/utils"

interface WeatherLocationCardProps {
  location: UserSettings["location"]
  onChange: (location: UserSettings["location"]) => void
}

type AlertKey = keyof WeatherAlertPreferences

const ALERT_ITEMS: Array<{
  key: AlertKey
  label: string
  description: string
  icon: React.ReactNode
}> = [
  {
    key: "zonda",
    label: "Viento Zonda",
    description: "Avisa cuando se anuncian ráfagas secas y cálidas.",
    icon: <Wind className="size-4" />,
  },
  {
    key: "frost",
    label: "Heladas",
    description: "Notifica si la temperatura nocturna baja de 2 °C.",
    icon: <Snowflake className="size-4" />,
  },
  {
    key: "hail",
    label: "Granizo",
    description: "Te avisa con tiempo para cubrir tus plantas exteriores.",
    icon: <CloudRain className="size-4" />,
  },
  {
    key: "heatwave",
    label: "Ola de calor",
    description: "Recomienda riego extra cuando supera 35 °C.",
    icon: <Sun className="size-4" />,
  },
  {
    key: "wateringReminder",
    label: "Recordatorio de riego",
    description: "Te avisa cuando alguna planta esté lista para regar.",
    icon: <Droplets className="size-4" />,
  },
]

export function WeatherLocationCard({
  location,
  onChange,
}: WeatherLocationCardProps) {
  function setAlert(key: AlertKey, value: boolean) {
    onChange({
      ...location,
      alerts: { ...location.alerts, [key]: value },
    })
  }

  return (
    <SettingsSection
      icon={<MapPin className="size-5" />}
      title="Clima y ubicación"
      description="Personalizá las alertas locales para tu jardín."
    >
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="weather-city">Ciudad</FieldLabel>
          <InputGroup>
            <InputGroupAddon>
              <MapPin className="size-4" aria-hidden="true" />
            </InputGroupAddon>
            <InputGroupInput
              id="weather-city"
              type="text"
              autoComplete="address-level2"
              placeholder="Mendoza, Argentina"
              value={location.city}
              onChange={(e) => onChange({ ...location, city: e.target.value })}
            />
          </InputGroup>
        </Field>

        <Field>
          <FieldLabel htmlFor="temp-unit">Unidades de temperatura</FieldLabel>
          <Select
            value={location.tempUnit}
            onValueChange={(v) =>
              onChange({ ...location, tempUnit: v as TempUnit })
            }
          >
            <SelectTrigger
              id="temp-unit"
              className="rounded-2xl border-2 border-border bg-card font-medium shadow-soft"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-2xl">
              <SelectItem value="celsius">
                <span className="flex items-center gap-2">
                  <Thermometer className="size-4" aria-hidden="true" />
                  Celsius (°C)
                </span>
              </SelectItem>
              <SelectItem value="fahrenheit">
                <span className="flex items-center gap-2">
                  <Thermometer className="size-4" aria-hidden="true" />
                  Fahrenheit (°F)
                </span>
              </SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </FieldGroup>

      <div className="flex flex-col gap-2 rounded-2xl border-2 border-dashed border-border bg-secondary/40 p-3">
        <p className="font-serif text-sm font-semibold">Alertas activas</p>
        <ul className="flex flex-col gap-2">
          {ALERT_ITEMS.map((item) => {
            const enabled = location.alerts[item.key]
            return (
              <li
                key={item.key}
                className={cn(
                  "flex items-start gap-3 rounded-2xl bg-card p-3 transition-colors",
                  enabled ? "border-2 border-primary/30" : "border-2 border-border",
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-xl",
                    enabled
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {item.icon}
                </span>
                <div className="min-w-0 flex-1">
                  <label
                    htmlFor={`alert-${item.key}`}
                    className="block text-sm font-semibold"
                  >
                    {item.label}
                  </label>
                  <p className="text-xs text-muted-foreground text-pretty">
                    {item.description}
                  </p>
                </div>
                <Switch
                  id={`alert-${item.key}`}
                  checked={enabled}
                  onCheckedChange={(v) => setAlert(item.key, v)}
                  aria-label={`Activar alertas de ${item.label}`}
                />
              </li>
            )
          })}
        </ul>
      </div>
    </SettingsSection>
  )
}
