"use client"

import { ExternalLink, ShoppingBag } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * Producto que vino del MCP/searchProducts de Mercado Libre, normalizado
 * en `lib/mercadolibre.ts`. Es la ficha del catálogo (sin precio en vivo
 * porque ML restringe ese acceso para apps con sólo Client Credentials).
 * El usuario hace click y ve los precios actualizados en mercadolibre.com.ar.
 */
export interface AgentProduct {
  id: string
  title: string
  brand: string | null
  model: string | null
  thumbnail: string
  permalink: string
}

/**
 * Renderiza el resultado de la tool searchProducts como un carrusel
 * horizontal scrolleable. Va FUERA del bubble del agente para poder
 * usar todo el ancho del mensaje y que las cards se vean cómodas.
 */
export function AgentProductCarousel({
  query,
  products,
}: {
  query: string
  products: AgentProduct[]
}) {
  if (products.length === 0) {
    return (
      <div className="ml-10 flex items-center gap-2 rounded-2xl border-2 border-dashed border-border bg-card/60 px-4 py-3 text-sm text-muted-foreground">
        <ShoppingBag className="size-4 shrink-0" aria-hidden="true" />
        <span>
          No encontré productos para{" "}
          <span className="font-medium text-foreground">{query}</span> en el
          catálogo de Mercado Libre.
        </span>
      </div>
    )
  }

  return (
    <div className="-mr-5 ml-10 flex flex-col gap-2">
      <header className="pr-5">
        <p className="text-xs font-semibold text-muted-foreground">
          {products.length} ficha{products.length === 1 ? "" : "s"} en el
          catálogo de Mercado Libre
        </p>
        <p className="text-[11px] leading-snug text-muted-foreground">
          Tocá una para ver precios actualizados.
        </p>
      </header>

      <div
        className="scrollbar-hide flex gap-3 overflow-x-auto pr-5 pb-2"
        style={{ scrollbarWidth: "none" }}
      >
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </div>
  )
}

function ProductCard({ product }: { product: AgentProduct }) {
  // Línea secundaria: marca y modelo si vinieron, si no nada (no
  // queremos mostrar "null" ni "Marca: -").
  const subtitle = [product.brand, product.model]
    .filter((s): s is string => Boolean(s))
    .join(" · ")

  return (
    <a
      href={product.permalink}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "group flex w-44 shrink-0 flex-col overflow-hidden rounded-2xl border-2 border-border bg-card shadow-soft transition-transform",
        "hover:-translate-y-0.5 hover:border-primary/40 active:translate-y-0",
      )}
    >
      <div className="relative aspect-square w-full overflow-hidden bg-secondary">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.thumbnail}
          alt={product.title}
          loading="lazy"
          className="size-full object-cover transition-transform group-hover:scale-105"
        />
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <p className="line-clamp-2 text-xs leading-snug text-foreground">
          {product.title}
        </p>
        {subtitle ? (
          <p className="line-clamp-1 text-[11px] text-muted-foreground">
            {subtitle}
          </p>
        ) : null}
        <span className="mt-auto inline-flex items-center gap-1 self-start text-[11px] font-semibold text-primary">
          Ver precios en ML
          <ExternalLink className="size-3" aria-hidden="true" />
        </span>
      </div>
    </a>
  )
}
