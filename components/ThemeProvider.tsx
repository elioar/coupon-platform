"use client"

import { createContext, useContext, useEffect, useCallback, useState } from "react"

type Theme = "dark" | "light" | "system"

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  resolvedTheme: "dark" | "light"
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
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

  // Function to apply theme to DOM - use useCallback to prevent recreation
  const applyTheme = useCallback((newTheme: Theme) => {
    if (typeof window === "undefined") return

    const root = window.document.documentElement
    
    // Remove both classes first to ensure clean state
    root.classList.remove("light", "dark")

    let resolved: "dark" | "light"

    if (newTheme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
      resolved = systemTheme
      root.classList.add(systemTheme)
    } else {
      resolved = newTheme
      root.classList.add(newTheme)
    }

    // Force a reflow to ensure the class is applied
    root.offsetHeight

    setResolvedTheme(resolved)
    
    // Save to localStorage
    try {
      localStorage.setItem("theme", newTheme)
    } catch (e) {
      // Ignore localStorage errors
    }
  }, [])

  // Wrapper for setTheme that applies theme immediately
  const setTheme = useCallback((newTheme: Theme) => {
    // Update state first
    setThemeState(newTheme)
    
    // Apply theme immediately for instant feedback (synchronous)
    if (typeof window !== "undefined") {
      const root = window.document.documentElement
      
      // Remove both classes first
      root.classList.remove("light", "dark")
      
      let resolved: "dark" | "light"
      if (newTheme === "system") {
        const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light"
        resolved = systemTheme
        root.classList.add(systemTheme)
      } else {
        resolved = newTheme
        root.classList.add(newTheme)
      }
      
      // Force a reflow to ensure the class is applied before any repaint
      void root.offsetHeight
      
      // Update resolved theme state
      setResolvedTheme(resolved)
      
      // Save to localStorage
      try {
        localStorage.setItem("theme", newTheme)
      } catch (e) {
        // Ignore localStorage errors (e.g., in private browsing)
      }
    }
  }, [])
  
  // Apply theme on mount and when theme changes
  useEffect(() => {
    applyTheme(theme)
  }, [theme, applyTheme])

  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Listen for system theme changes ONLY when theme is set to "system"
  useEffect(() => {
    if (!mounted || theme !== "system") return

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
    const handleChange = () => {
      // Only update if theme is still "system" (user hasn't changed it)
      if (theme === "system") {
        const root = window.document.documentElement
        root.classList.remove("light", "dark")
        const systemTheme = mediaQuery.matches ? "dark" : "light"
        root.classList.add(systemTheme)
        setResolvedTheme(systemTheme)
      }
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

