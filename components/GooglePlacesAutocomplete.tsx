"use client"

import { useEffect, useRef, useState } from "react"

interface GooglePlacesAutocompleteProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  id?: string
  name?: string
  locale?: string
}

declare global {
  interface Window {
    google: any
    googleMapsLoadingPromise: Promise<void> | null
  }
}

// Global singleton to track script loading
let googleMapsLoadingPromise: Promise<void> | null = null

function loadGoogleMapsScript(apiKey: string, locale: string): Promise<void> {
  // If already loaded, return resolved promise
  if (window.google && window.google.maps && window.google.maps.places) {
    return Promise.resolve()
  }

  // If already loading, return the existing promise
  if (googleMapsLoadingPromise) {
    return googleMapsLoadingPromise
  }

  // Check if script tag already exists
  const existingScript = document.querySelector('script[src*="maps.googleapis.com"]')
  if (existingScript) {
    // Wait for it to load
    googleMapsLoadingPromise = new Promise((resolve, reject) => {
      const checkLoaded = setInterval(() => {
        if (window.google && window.google.maps && window.google.maps.places) {
          clearInterval(checkLoaded)
          resolve()
        }
      }, 100)

      // Timeout after 10 seconds
      setTimeout(() => {
        clearInterval(checkLoaded)
        reject(new Error("Timeout waiting for Google Maps to load"))
      }, 10000)
    })
    return googleMapsLoadingPromise
  }

  // Create new loading promise
  googleMapsLoadingPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script")
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&language=${locale}`
    script.async = true
    script.defer = true

    script.onload = () => {
      // Wait a bit for Google Maps to fully initialize
      const checkInit = setInterval(() => {
        if (window.google && window.google.maps) {
          // Check for specific API errors
          if (window.google.maps.Error) {
            const error = window.google.maps.Error
            if (error === 'ApiNotActivatedMapError') {
              clearInterval(checkInit)
              googleMapsLoadingPromise = null
              reject(new Error("Maps JavaScript API is not enabled. Please enable it in Google Cloud Console: https://console.cloud.google.com/apis/library/maps-backend.googleapis.com"))
              return
            }
          }
          
          if (window.google.maps.places) {
            clearInterval(checkInit)
            resolve()
          }
        }
      }, 50)

      setTimeout(() => {
        clearInterval(checkInit)
        if (window.google && window.google.maps && window.google.maps.places) {
          resolve()
        } else if (window.google && window.google.maps) {
          // Check for API errors
          const errorMessage = window.google?.maps?.Error || "Unknown error"
          googleMapsLoadingPromise = null
          reject(new Error(`Google Maps loaded but Places API not available. Error: ${errorMessage}. Please enable Maps JavaScript API and Places API in Google Cloud Console.`))
        } else {
          reject(new Error("Google Maps loaded but Places API not available"))
        }
      }, 2000)
    }

    script.onerror = () => {
      googleMapsLoadingPromise = null
      reject(new Error("Failed to load Google Maps JavaScript API. Check your API key and network connection."))
    }

    document.head.appendChild(script)
  })

  return googleMapsLoadingPromise
}

export default function GooglePlacesAutocomplete({
  value,
  onChange,
  placeholder = "Enter location...",
  className = "",
  id,
  name,
  locale = "en",
}: GooglePlacesAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const autocompleteRef = useRef<any>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [apiError, setApiError] = useState<string | null>(null)

  useEffect(() => {
    // Check if Google Maps is already loaded
    if (window.google && window.google.maps && window.google.maps.places) {
      setIsLoaded(true)
      setIsLoading(false)
      return
    }

    // Get API key
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    if (!apiKey) {
      console.error("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is not set. Please add it to your .env file.")
      setIsLoading(false)
      return
    }

    // Load script using singleton pattern
    loadGoogleMapsScript(apiKey, locale)
      .then(() => {
        setIsLoaded(true)
        setIsLoading(false)
        setApiError(null)
      })
      .catch((error) => {
        console.error("Error loading Google Maps:", error)
        setIsLoading(false)
        setIsLoaded(false)
        // Set error message but don't block the input
        if (error.message.includes("ApiNotActivatedMapError") || error.message.includes("not enabled")) {
          setApiError("Maps JavaScript API not enabled. You can still type manually.")
          console.warn("⚠️ Maps JavaScript API is not enabled. Autocomplete will not work, but you can still type the location manually.")
        } else {
          setApiError("Google Maps failed to load. You can still type manually.")
        }
      })
  }, [locale])

  // Sync input value with React state
  useEffect(() => {
    if (inputRef.current && inputRef.current.value !== value) {
      inputRef.current.value = value
    }
  }, [value])

  useEffect(() => {
    // Only try to initialize autocomplete if API is loaded
    if (!isLoaded || !inputRef.current) return

    // Initialize Autocomplete
    try {
      // Check if Places API is available
      if (!window.google?.maps?.places) {
        console.warn("Places API is not available. Input will work as regular text field.")
        setApiError("Places API not available. You can still type manually.")
        return
      }

      // Configure autocomplete with better search options
      // Note: "establishment" cannot be mixed with "geocode" or "address"
      // Using "geocode" which includes both addresses and establishments
      autocompleteRef.current = new window.google.maps.places.Autocomplete(
        inputRef.current,
        {
          // Use "geocode" which includes addresses, establishments, and other locations
          // This is the most flexible option that works for business locations
          types: ["geocode"],
          // Get comprehensive place information
          fields: [
            "formatted_address",
            "geometry",
            "name",
            "address_components",
            "place_id",
            "types",
          ],
          // Component restrictions - you can restrict to specific countries if needed
          // componentRestrictions: { country: ["gr", "us"] }, // Uncomment and add countries if needed
        }
      )

      // Listen for place selection
      autocompleteRef.current.addListener("place_changed", () => {
        const place = autocompleteRef.current.getPlace()
        
        if (place) {
          // Prefer formatted_address, but fallback to name if address not available
          const address = place.formatted_address || place.name || ""
          
          if (address) {
            // Update React state immediately
            onChange(address)
            
            // Also ensure the input value is set correctly (Google Places might have set it already)
            if (inputRef.current && inputRef.current.value !== address) {
              inputRef.current.value = address
            }
            
            // Log place details for debugging (can be removed in production)
            if (process.env.NODE_ENV === "development") {
              console.log("Selected place:", {
                address: place.formatted_address,
                name: place.name,
                placeId: place.place_id,
                location: place.geometry?.location,
              })
            }
          }
        }
      })

      // Clear any previous errors on success
      setApiError(null)
    } catch (error: any) {
      console.error("Error initializing Google Places Autocomplete:", error)
      setApiError("Autocomplete unavailable. You can still type manually.")
      // Don't block the input - let user type manually
    }

    // Cleanup
    return () => {
      if (autocompleteRef.current) {
        try {
          if (window.google?.maps?.event) {
            window.google.maps.event.clearInstanceListeners(autocompleteRef.current)
          }
        } catch (e) {
          // Ignore cleanup errors
        }
        autocompleteRef.current = null
      }
    }
  }, [isLoaded, onChange])

  return (
    <div className="relative">
      <div className="relative">
      <input
        ref={inputRef}
        type="text"
        id={id}
        name={name}
        value={value}
        onChange={(e) => {
          // Update state immediately when user types
          onChange(e.target.value)
        }}
        onBlur={(e) => {
          // Ensure value is synced on blur (when user clicks away)
          if (e.target.value !== value) {
            onChange(e.target.value)
          }
        }}
        placeholder={placeholder}
        className={className}
        disabled={isLoading}
        autoComplete="off"
      />
        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <svg
              className="h-4 w-4 animate-spin text-gray-400"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </div>
        )}
        {value && !isLoading && isLoaded && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            aria-label="Clear location"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>
      {apiError && !isLoading && (
        <div className="absolute -bottom-5 left-0 text-xs text-amber-600 dark:text-amber-400">
          {apiError}
        </div>
      )}
    </div>
  )
}

