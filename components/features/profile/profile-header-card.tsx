"use client"

import { Sprout } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

function getInitials(name: string, email: string) {
  const source = name.trim() || email.split("@")[0] || "JA"
  const parts = source.split(/[\s._-]+/).filter(Boolean)
  const first = parts[0]?.[0] ?? "J"
  const second = parts[1]?.[0] ?? source[1] ?? "A"
  return `${first}${second}`.toUpperCase()
}

interface ProfileHeaderCardProps {
  name: string
  email: string
  avatarUrl?: string | null
  level?: string
}

export function ProfileHeaderCard({
  name,
  email,
  avatarUrl,
  level = "Jardinero Aprendiz",
}: ProfileHeaderCardProps) {
  const displayName = name.trim() || email.split("@")[0] || "Jardinero"
  const initials = getInitials(name, email)

  return (
    <section
      aria-label="Perfil del usuario"
      className="mx-5 flex flex-col items-center gap-3 rounded-3xl border-2 border-border bg-card px-5 py-6 text-center shadow-soft"
    >
      <div className="relative">
        <Avatar className="size-20 border-4 border-primary/20 shadow-soft">
          {avatarUrl ? (
            <AvatarImage src={avatarUrl} alt={`Foto de ${displayName}`} />
          ) : null}
          <AvatarFallback className="bg-primary/15 text-primary font-serif text-2xl font-bold">
            {initials}
          </AvatarFallback>
        </Avatar>
        <span
          aria-hidden="true"
          className="bg-primary text-primary-foreground absolute -bottom-1 -right-1 flex size-8 items-center justify-center rounded-full border-2 border-card shadow-soft"
        >
          <Sprout className="size-4" />
        </span>
      </div>

      <div className="flex flex-col gap-1">
        <h2 className="font-serif text-2xl leading-tight font-bold text-pretty">
          {displayName}
        </h2>
        {email ? (
          <p className="text-xs text-muted-foreground">{email}</p>
        ) : null}
      </div>

      <Badge
        variant="outline"
        className="border-primary/30 bg-primary/10 text-primary gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
      >
        <Sprout className="size-3.5" aria-hidden="true" />
        Nivel: {level}
      </Badge>
    </section>
  )
}
