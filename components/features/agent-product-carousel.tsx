"use client"

import { ExternalLink, MapPin, Truck, ShoppingBag } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * Producto que vino del MCP/search_products de Mercado Libre, normalizado
 * en `lib/mercadolibre.ts`. Lo redeclaramos acá porque el mensaje del chat
 * no tiene tipos fuertes (los `tool-*` parts vienen como `unknown`).
 */
export interface AgentProduct {
  id: string
  title: string
  price: number
  currency: string
  thumbnail: string
  permalink: string
  state: string | null
  city: string | null
  freeShipping: boolean
  soldQuantity: number
}

/**
 * Renderiza el resultado de la tool searchProducts como un carrusel
 * horizontal scrolleable. Va FUERA del bubble del agente para poder
 * usar todo el ancho del mensaje y que las cards se vean cómodas.
 */
export function AgentProductCarousel({
  query,
  preferredState,
  products,
}: {
  query: string
  preferredState: string | null
  products: AgentProduct[]
}) {
  if (products.length === 0) {
    return (
      <div className="ml-10 flex items-center gap-2 rounded-2xl border-2 border-dashed border-border bg-card/60 px-4 py-3 text-sm text-muted-foreground">
        <ShoppingBag className="size-4 shrink-0" aria-hidden="true" />
        <span>
          No encontré productos para{" "}
          <span className="font-medium text-foreground">{query}</span> en
          Mercado Libre.
        </span>
      </div>
    )
  }

  return (
    <div className="-mr-5 ml-10 flex flex-col gap-2">
      <header className="flex items-baseline justify-between gap-2 pr-5">
        <p className="text-xs font-semibold text-muted-foreground">
          {products.length} resultado{products.length === 1 ? "" : "s"} en
          Mercado Libre
        </p>
        {preferredState ? (
          <p className="text-[11px] text-muted-foreground">
            Priorizando {preferredState}
          </p>
        ) : null}
      </header>

      <div
        className="scrollbar-hide flex gap-3 overflow-x-auto pr-5 pb-2"
        style={{ scrollbarWidth: "none" }}
      >
        {products.map((p) => (
          <ProductCard key={p.id} product={p} preferredState={preferredState} />
        ))}
      </div>
    </div>
  )
}

function ProductCard({
  product,
  preferredState,
}: {
  product: AgentProduct
  preferredState: string | null
}) {
  const isLocal =
    preferredState !== null &&
    product.state?.toLowerCase() === preferredState.toLowerCase()

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
        {product.thumbnail ? (
          // Usamos <img> nativa porque las URLs de ML cambian de dominio y
          // no nos interesa pasar por el optimizer de Next para thumbnails
          // pequeños de productos externos.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.thumbnail}
            alt={product.title}
            loading="lazy"
            className="size-full object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="flex size-full items-center justify-center">
            <ShoppingBag className="size-6 text-muted-foreground" aria-hidden="true" />
          </div>
        )}

        {isLocal ? (
          <span className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground shadow-soft">
            <MapPin className="size-3" aria-hidden="true" />
            Cerca tuyo
          </span>
        ) : null}

        {product.freeShipping ? (
          <span className="absolute right-2 bottom-2 inline-flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold text-accent-foreground shadow-soft">
            <Truck className="size-3" aria-hidden="true" />
            Envío gratis
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <p className="line-clamp-2 text-xs leading-snug text-foreground">
          {product.title}
        </p>
        <p className="font-serif text-base leading-tight font-bold tabular-nums">
          {formatPrice(product.price, product.currency)}
        </p>
        <p className="mt-auto flex items-center gap-1 text-[11px] text-muted-foreground">
          <MapPin className="size-3 shrink-0" aria-hidden="true" />
          <span className="truncate">
            {product.city || product.state || "Argentina"}
          </span>
        </p>
        <span className="inline-flex items-center gap-1 self-start text-[11px] font-medium text-primary">
          Ver en ML
          <ExternalLink className="size-3" aria-hidden="true" />
        </span>
      </div>
    </a>
  )
}

function formatPrice(value: number, currency: string): string {
  try {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(value)
  } catch {
    return `$ ${value.toLocaleString("es-AR")}`
  }
}
