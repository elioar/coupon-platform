"use client"

import { createContext, useContext, useEffect, useState } from "react"

type Theme = "dark" | "light" | "system"

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  resolvedTheme: "dark" | "light"
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    // Initialize from localStorage if available
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("theme") as Theme | null
      if (stored && ["light", "dark", "system"].includes(stored)) {
        return stored
      }
    }
    return "system"
  })
  
  const [resolvedTheme, setResolvedTheme] = useState<"dark" | "light">(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("theme") as Theme | null
      if (stored === "dark") return "dark"
      if (stored === "light") return "light"
      // System or no preference
      return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
    }
    return "light"
  })
  
  // Apply theme immediately when it changes or on mount
  useEffect(() => {
    if (typeof window === "undefined") return

    const root = window.document.documentElement
    
    // Remove both classes first to ensure clean state
    root.classList.remove("light", "dark")

    let resolved: "dark" | "light"

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
      resolved = systemTheme
      root.classList.add(systemTheme)
    } else {
      resolved = theme
      root.classList.add(theme)
    }

    // Force a reflow to ensure the class is applied
    root.offsetHeight

    setResolvedTheme(resolved)
    
    // Save to localStorage
    try {
      localStorage.setItem("theme", theme)
    } catch (e) {
      // Ignore localStorage errors
    }
  }, [theme])

  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Listen for system theme changes
  useEffect(() => {
    if (!mounted || theme !== "system") return

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
    const handleChange = () => {
      const root = window.document.documentElement
      root.classList.remove("light", "dark")
      const systemTheme = mediaQuery.matches ? "dark" : "light"
      root.classList.add(systemTheme)
      setResolvedTheme(systemTheme)
    }

    mediaQuery.addEventListener("change", handleChange)
    return () => mediaQuery.removeEventListener("change", handleChange)
  }, [theme, mounted])

  // Always provide context, even before mounting
  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    // Return default values if ThemeProvider is not available (shouldn't happen, but safety check)
    return {
      theme: "system" as Theme,
      setTheme: () => {},
      resolvedTheme: "light" as const,
    }
  }
  return context
}

