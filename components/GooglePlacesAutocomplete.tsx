"use client"

import { useEffect, useRef, useState } from "react"

interface GooglePlacesAutocompleteProps {
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
  onCoordinatesChange,
  onPlaceSelected,
  placeholder = "Enter location...",
  className = "",
  id,
  name,
  locale = "en",
}: GooglePlacesAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const autocompleteRef = useRef<any>(null)
  const placeAutocompleteElementRef = useRef<any>(null)
  const suppressNextInputEventRef = useRef(false)
  const placeSelectedRef = useRef(false)
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
        setIsLoading(false)
        setIsLoaded(false)
        // Set error message but don't block the input
        if (error.message.includes("ApiNotActivatedMapError") || error.message.includes("not enabled")) {
          setApiError("Maps JavaScript API not enabled. You can still type manually.")
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

    // Prefer PlaceAutocompleteElement (recommended by Google) when available.
    try {
      // Check if Places API is available
      if (!window.google?.maps?.places) {
        setApiError("Places API not available. You can still type manually.")
        return
      }

      const placesAny = window.google.maps.places as any

      // Attempt to use the new PlaceAutocompleteElement on the existing input.
      // This keeps our Tailwind-styled input while avoiding the legacy Autocomplete warning.
      if (placesAny.PlaceAutocompleteElement) {
        try {
          const el = new placesAny.PlaceAutocompleteElement()
          placeAutocompleteElementRef.current = el

          // Some implementations allow binding to an existing input via inputElement.
          if ("inputElement" in el) {
            ;(el as any).inputElement = inputRef.current
          }

          // Sync placeholder if supported
          if ("placeholder" in el) {
            ;(el as any).placeholder = placeholder
          }

          // Listen for selection events (API uses gmp-placeselect)
          const handler = async (event: any) => {
            const place = event?.place ?? event?.detail?.place ?? (el as any).place
            if (!place) return

            try {
              if (typeof place.fetchFields === "function") {
                await place.fetchFields({
                  fields: ["formattedAddress", "location", "displayName", "name"],
                })
              }
            } catch {
              // ignore field fetch failures
            }

            const address =
              place.formattedAddress ||
              place.formatted_address ||
              place.displayName ||
              place.name ||
              ""

            const loc =
              place.location ||
              place.geometry?.location ||
              null

            const lat =
              loc && typeof loc.lat === "function" ? loc.lat() : loc?.lat
            const lng =
              loc && typeof loc.lng === "function" ? loc.lng() : loc?.lng

            if (address) {
              // Prevent the underlying input from emitting a subsequent onChange that would
              // be treated as "manual typing" by parent code (which can clear coordinates).
              suppressNextInputEventRef.current = true
              placeSelectedRef.current = true
              console.log("[GooglePlacesAutocomplete] Place selected:", { address, lat, lng })
              if (
                typeof lat === "number" &&
                typeof lng === "number" &&
                !isNaN(lat) &&
                !isNaN(lng) &&
                typeof onPlaceSelected === "function"
              ) {
                console.log("[GooglePlacesAutocomplete] Calling onPlaceSelected with:", { address, lat, lng })
                onPlaceSelected({ address, lat, lng })
              } else {
                console.log("[GooglePlacesAutocomplete] No valid coords, calling onChange")
                onChange(address)
              }
              if (inputRef.current && inputRef.current.value !== address) {
                inputRef.current.value = address
              }
              // Reset after a short delay to allow onChange to process
              setTimeout(() => {
                placeSelectedRef.current = false
              }, 100)
            }

            if (typeof lat === "number" && typeof lng === "number" && !isNaN(lat) && !isNaN(lng)) {
              if (onCoordinatesChange) onCoordinatesChange(lat, lng)
            }
          }

          // Register listener
          if (typeof el.addEventListener === "function") {
            el.addEventListener("gmp-placeselect", handler)
            ;(el as any).__vpHandler = handler
          }

          // If we got here, we successfully set up the new element. Clear any previous errors and skip legacy.
          setApiError(null)
          return () => {
            try {
              const cleanupHandler = (el as any).__vpHandler
              if (cleanupHandler && typeof el.removeEventListener === "function") {
                el.removeEventListener("gmp-placeselect", cleanupHandler)
              }
            } catch {
              // ignore cleanup errors
            }
            placeAutocompleteElementRef.current = null
          }
        } catch {
          // Fall back to legacy below
          placeAutocompleteElementRef.current = null
        }
      }

      // Fallback: legacy Autocomplete
      // Configure autocomplete with better search options
      // Note: "establishment" cannot be mixed with "geocode" or "address"
      // Using "geocode" which includes both addresses and establishments
      console.log("[GooglePlacesAutocomplete] Initializing legacy Autocomplete")
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
      console.log("[GooglePlacesAutocomplete] Legacy Autocomplete initialized:", autocompleteRef.current)

      // Listen for place selection
      autocompleteRef.current.addListener("place_changed", () => {
        console.log("[GooglePlacesAutocomplete] place_changed event fired!")
        const place = autocompleteRef.current.getPlace()
        console.log("[GooglePlacesAutocomplete] place object:", place)
        
        if (place) {
          // Prefer formatted_address, but fallback to name if address not available
          const address = place.formatted_address || place.name || ""
          
          if (address) {
            // Mark that a place was selected to prevent onChange from clearing coordinates
            suppressNextInputEventRef.current = true
            placeSelectedRef.current = true
            
            const loc = place.geometry?.location || null
            const lat = loc ? (typeof loc.lat === "function" ? loc.lat() : loc.lat) : null
            const lng = loc ? (typeof loc.lng === "function" ? loc.lng() : loc.lng) : null

            console.log("[GooglePlacesAutocomplete] place_changed - extracted:", { address, lat, lng })

            if (
              typeof lat === "number" &&
              typeof lng === "number" &&
              !isNaN(lat) &&
              !isNaN(lng) &&
              typeof onPlaceSelected === "function"
            ) {
              console.log("[GooglePlacesAutocomplete] Calling onPlaceSelected from place_changed")
              onPlaceSelected({ address, lat, lng })
            } else {
              console.log("[GooglePlacesAutocomplete] No valid coords in place_changed, calling onChange")
              onChange(address)
            }
            
            // Also ensure the input value is set correctly (Google Places might have set it already)
            if (inputRef.current && inputRef.current.value !== address) {
              inputRef.current.value = address
            }
            
            // Reset after a short delay to allow onChange to process
            setTimeout(() => {
              placeSelectedRef.current = false
            }, 100)
          }

          // Extract and pass coordinates if available
          if (place.geometry?.location && onCoordinatesChange) {
            const lat = typeof place.geometry.location.lat === 'function' 
              ? place.geometry.location.lat() 
              : place.geometry.location.lat
            const lng = typeof place.geometry.location.lng === 'function' 
              ? place.geometry.location.lng() 
              : place.geometry.location.lng
            
            if (typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng)) {
              onCoordinatesChange(lat, lng)
            }
          }
        }
      })
      console.log("[GooglePlacesAutocomplete] place_changed listener attached")

      // Clear any previous errors on success
      setApiError(null)
    } catch (error: any) {
      setApiError("Autocomplete unavailable. You can still type manually.")
      // Don't block the input - let user type manually
    }

    // Cleanup
    return () => {
      if (placeAutocompleteElementRef.current) {
        try {
          const el = placeAutocompleteElementRef.current
          const cleanupHandler = (el as any).__vpHandler
          if (cleanupHandler && typeof el.removeEventListener === "function") {
            el.removeEventListener("gmp-placeselect", cleanupHandler)
          }
        } catch {
          // ignore cleanup errors
        }
        placeAutocompleteElementRef.current = null
      }
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
  }, [isLoaded, onChange, onCoordinatesChange, onPlaceSelected, placeholder])

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
          if (suppressNextInputEventRef.current) {
            console.log("[GooglePlacesAutocomplete] onChange suppressed (after selection)")
            suppressNextInputEventRef.current = false
            return
          }
          console.log("[GooglePlacesAutocomplete] onChange called with:", e.target.value)
          // If a place was just selected, don't clear coordinates
          if (placeSelectedRef.current) {
            console.log("[GooglePlacesAutocomplete] onChange: place was selected, not clearing coords")
            onChange(e.target.value)
            return
          }
          // Update state immediately when user types
          onChange(e.target.value)
        }}
        onBlur={(e) => {
          if (suppressNextInputEventRef.current) {
            suppressNextInputEventRef.current = false
            return
          }
          
          // Check if a place was selected when user clicks away
          if (autocompleteRef.current && typeof onPlaceSelected === "function") {
            const place = autocompleteRef.current.getPlace()
            if (place && place.geometry?.location) {
              const address = place.formatted_address || place.name || e.target.value
              const loc = place.geometry.location
              const lat = typeof loc.lat === "function" ? loc.lat() : loc.lat
              const lng = typeof loc.lng === "function" ? loc.lng() : loc.lng
              
              if (typeof lat === "number" && typeof lng === "number" && !isNaN(lat) && !isNaN(lng)) {
                console.log("[GooglePlacesAutocomplete] onBlur: place found, calling onPlaceSelected")
                placeSelectedRef.current = true
                onPlaceSelected({ address, lat, lng })
                setTimeout(() => {
                  placeSelectedRef.current = false
                }, 100)
                return
              }
            }
          }
          
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

