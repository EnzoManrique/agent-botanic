"use client"

import { useRouter } from "next/navigation"
import { LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/hooks/use-auth"

const APP_VERSION = "Vercel Zero-To-Agent v1.0"

export function AccountActions() {
  const { logout } = useAuth()
  const router = useRouter()

  function handleLogout() {
    logout()
    router.replace("/login")
  }

  return (
    <section className="mx-5 flex flex-col items-center gap-3 pt-2">
      <Button
        type="button"
        onClick={handleLogout}
        variant="outline"
        className="bg-accent/15 text-accent border-accent/40 hover:bg-accent/25 hover:text-accent w-full justify-center gap-2 rounded-2xl border-2 py-6 font-semibold shadow-soft"
      >
        <LogOut className="size-4" aria-hidden="true" />
        Cerrar sesión
      </Button>
      <p className="text-muted-foreground text-[11px] font-medium tracking-wide">
        {APP_VERSION}
      </p>
    </section>
  )
}
