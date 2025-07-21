"use client"

import * as React from "react"

const FONT_STORAGE_KEY = "schedule-font"

export type Font = 
  // Default
  "pt-sans" |
  // Professional
  "lato" | "open-sans" | "montserrat" |
  // Handwritten
  "merienda" | "bad-script" | "caveat" |
  // Fancy
  "playfair-display" | "lobster" | "pacifico";


type FontProviderProps = {
  children: React.ReactNode
  defaultFont?: Font
}

type FontProviderState = {
  font: Font
  setFont: (font: Font) => void
}

const initialState: FontProviderState = {
  font: "pt-sans",
  setFont: () => null,
}

const FontProviderContext = React.createContext<FontProviderState>(initialState)

export function FontProvider({
  children,
  defaultFont = "pt-sans",
  ...props
}: FontProviderProps) {
  const [font, setFont] = React.useState<Font>(() => {
    if (typeof window === 'undefined') {
      return defaultFont;
    }
    try {
      return (localStorage.getItem(FONT_STORAGE_KEY) as Font) || defaultFont
    } catch (e) {
      console.warn("Failed to get font from localStorage", e)
      return defaultFont
    }
  })

  React.useEffect(() => {
    const root = window.document.documentElement
    root.style.setProperty('--font-body', `var(--font-${font})`)
  }, [font])

  const value = {
    font,
    setFont: (font: Font) => {
      try {
        localStorage.setItem(FONT_STORAGE_KEY, font)
      } catch (e) {
        console.warn("Failed to set font in localStorage", e)
      }
      setFont(font)
    },
  }

  return (
    <FontProviderContext.Provider {...props} value={value}>
      {children}
    </FontProviderContext.Provider>
  )
}

export const useFont = () => {
  const context = React.useContext(FontProviderContext)

  if (context === undefined)
    throw new Error("useFont must be used within a FontProvider")

  return context
}
