"use client"

import { useEffect, useRef, useState } from "react"

interface Suggestion {
  address: string
  latitude: number
  longitude: number
  city: string | null
  postalCode: string | null
}

interface AddressAutocompleteProps {
  value: string
  onChange: (value: string) => void
  onCoordinatesChange?: (lat: number, lng: number) => void
  onPlaceSelected?: (payload: { address: string; lat: number; lng: number }) => void
  placeholder?: string
  className?: string
  id?: string
  name?: string
  locale?: string
}

// Nominatim allows ~1 request/second, so we wait for a typing pause before querying.
const DEBOUNCE_MS = 450
const MIN_QUERY_LENGTH = 3

export default function AddressAutocomplete({
  value,
  onChange,
  onCoordinatesChange,
  onPlaceSelected,
  placeholder,
  className = "",
  id,
  name,
  locale = "en",
}: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)

  const containerRef = useRef<HTMLDivElement>(null)
  // Set when the value changes programmatically (a suggestion was picked, or the
  // parent reset the field) so we don't immediately search for what we just filled in.
  const skipNextSearchRef = useRef(true)

  useEffect(() => {
    if (skipNextSearchRef.current) {
      skipNextSearchRef.current = false
      return
    }

    const query = value.trim()
    if (query.length < MIN_QUERY_LENGTH) {
      setSuggestions([])
      setIsOpen(false)
      return
    }

    const controller = new AbortController()
    const timer = setTimeout(async () => {
      setIsLoading(true)
      try {
        const response = await fetch(
          `/api/geocode/search?q=${encodeURIComponent(query)}&locale=${locale}`,
          { signal: controller.signal }
        )
        if (!response.ok) return

        const data = await response.json()
        setSuggestions(data.results ?? [])
        setIsOpen((data.results ?? []).length > 0)
        setHighlightedIndex(-1)
      } catch {
        // Aborted or network error - leave the previous suggestions alone.
      } finally {
        setIsLoading(false)
      }
    }, DEBOUNCE_MS)

    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [value, locale])

  // Close the dropdown when clicking anywhere else on the page.
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const selectSuggestion = (suggestion: Suggestion) => {
    skipNextSearchRef.current = true
    onChange(suggestion.address)
    onCoordinatesChange?.(suggestion.latitude, suggestion.longitude)
    onPlaceSelected?.({
      address: suggestion.address,
      lat: suggestion.latitude,
      lng: suggestion.longitude,
    })
    setIsOpen(false)
    setSuggestions([])
    setHighlightedIndex(-1)
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || suggestions.length === 0) return

    if (event.key === "ArrowDown") {
      event.preventDefault()
      setHighlightedIndex((prev) => (prev + 1) % suggestions.length)
    } else if (event.key === "ArrowUp") {
      event.preventDefault()
      setHighlightedIndex((prev) => (prev <= 0 ? suggestions.length - 1 : prev - 1))
    } else if (event.key === "Enter" && highlightedIndex >= 0) {
      event.preventDefault()
      selectSuggestion(suggestions[highlightedIndex])
    } else if (event.key === "Escape") {
      setIsOpen(false)
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        id={id}
        name={name}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onFocus={() => suggestions.length > 0 && setIsOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={className}
        autoComplete="off"
      />

      {isLoading && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <svg className="h-4 w-4 animate-spin text-green-500" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </div>
      )}

      {isOpen && suggestions.length > 0 && (
        <ul className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-800">
          {suggestions.map((suggestion, index) => (
            <li key={`${suggestion.latitude},${suggestion.longitude}`}>
              <button
                type="button"
                onClick={() => selectSuggestion(suggestion)}
                onMouseEnter={() => setHighlightedIndex(index)}
                className={`flex w-full items-start gap-2 px-3 py-2 text-left text-sm transition-colors ${
                  index === highlightedIndex
                    ? "bg-green-50 text-green-900 dark:bg-green-900/30 dark:text-green-100"
                    : "text-zinc-700 hover:bg-zinc-50 dark:text-zinc-200 dark:hover:bg-zinc-700/50"
                }`}
              >
                <svg
                  className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="line-clamp-2">{suggestion.address}</span>
              </button>
            </li>
          ))}
          <li className="px-3 pt-1 text-[10px] text-zinc-400 dark:text-zinc-500">
            © OpenStreetMap contributors
          </li>
        </ul>
      )}
    </div>
  )
}
