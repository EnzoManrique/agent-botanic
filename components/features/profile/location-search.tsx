"use client"

import * as React from "react"
import { Check, ChevronsUpDown, MapPin, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { searchLocationsAction, type SearchResult } from "@/lib/actions/weather"
import { useDebounce } from "@/hooks/use-debounce"
import { Spinner } from "@/components/ui/spinner"

interface LocationSearchProps {
  value: string
  lat?: number
  lng?: number
  onChange: (value: string, lat: number, lng: number) => void
}

export function LocationSearch({ value, onChange }: LocationSearchProps) {
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")
  const [results, setResults] = React.useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = React.useState(false)
  const debouncedQuery = useDebounce(query, 500)

  React.useEffect(() => {
    async function search() {
      if (debouncedQuery.length < 3) {
        setResults([])
        return
      }
      setIsLoading(true)
      const data = await searchLocationsAction(debouncedQuery)
      setResults(data)
      setIsLoading(false)
    }
    search()
  }, [debouncedQuery])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between rounded-2xl border-2 border-border bg-card px-4 py-6 font-medium shadow-soft hover:bg-secondary/40"
        >
          <div className="flex items-center gap-2 truncate">
            <MapPin className="size-4 shrink-0 opacity-50" />
            <span className="truncate">{value || "Buscar ciudad..."}</span>
          </div>
          <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 rounded-2xl shadow-lg border-2 border-border" align="start">
        <Command shouldFilter={false}>
          <CommandInput 
            placeholder="Escribí el nombre de tu ciudad..." 
            value={query}
            onValueChange={setQuery}
            className="h-12"
          />
          <CommandList className="max-h-[300px]">
            {isLoading ? (
              <div className="flex items-center justify-center py-6">
                <Spinner className="size-6 text-primary" />
              </div>
            ) : (
              <>
                <CommandEmpty>
                  {query.length < 3 
                    ? "Escribí al menos 3 letras..." 
                    : "No se encontraron ciudades."}
                </CommandEmpty>
                <CommandGroup>
                  {results.map((result) => {
                    const label = [result.name, result.admin1, result.country]
                      .filter(Boolean)
                      .join(", ")
                    
                    return (
                      <CommandItem
                        key={result.id}
                        value={label}
                        onSelect={() => {
                          onChange(label, result.latitude, result.longitude)
                          setOpen(false)
                          setQuery("")
                        }}
                        className="flex items-center gap-3 py-3"
                      >
                        <div className="bg-primary/10 text-primary flex size-8 shrink-0 items-center justify-center rounded-lg">
                          <MapPin className="size-4" />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold truncate">{result.name}</span>
                          <span className="text-xs text-muted-foreground truncate">
                            {[result.admin1, result.country].filter(Boolean).join(", ")}
                          </span>
                        </div>
                        <Check
                          className={cn(
                            "ml-auto h-4 w-4",
                            value === label ? "opacity-100" : "opacity-0"
                          )}
                        />
                      </CommandItem>
                    )
                  })}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
