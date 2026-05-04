"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import esDict from "./es.json"
import enDict from "./en.json"

export type Language = "es" | "en"

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (section: string, key: string, params?: Record<string, string>) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("es")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Read from localStorage on mount
    const stored = localStorage.getItem("botanic-lang") as Language
    if (stored === "en" || stored === "es") {
      setLanguageState(stored)
    }
    setMounted(true)
  }, [])

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    localStorage.setItem("botanic-lang", lang)
  }

  const t = (section: string, key: string, params?: Record<string, string>) => {
    const dict: any = language === "en" ? enDict : esDict
    
    // Default to Spanish if missing in English
    const fallbackDict: any = esDict

    const sectionDict = dict[section] || fallbackDict[section]
    if (!sectionDict) return `${section}.${key}`

    let text = sectionDict[key] || fallbackDict[section]?.[key]
    if (!text) return `${section}.${key}`

    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        text = text.replace(`{${k}}`, v)
      })
    }
    
    return text
  }

  // To prevent hydration errors, render children after mounted
  if (!mounted) {
    return <div style={{ visibility: "hidden" }}>{children}</div>
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider")
  }
  return context
}
