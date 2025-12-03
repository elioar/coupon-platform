"use client"

import { useEffect, useRef, useState } from "react"

interface GoogleMapPickerProps {
  address: string
  onLocationChange: (address: string, lat: number, lng: number) => void
  locale?: string
  className?: string
  darkMode?: boolean
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
  if (window.google && window.google.maps && window.google.maps.places && window.google.maps.Geocoder) {
    return Promise.resolve()
  }

  if (googleMapsLoadingPromise) {
    return googleMapsLoadingPromise
  }

  const existingScript = document.querySelector('script[src*="maps.googleapis.com"]')
  if (existingScript) {
    googleMapsLoadingPromise = new Promise((resolve, reject) => {
      const checkLoaded = setInterval(() => {
        if (window.google && window.google.maps && window.google.maps.places && window.google.maps.Geocoder) {
          clearInterval(checkLoaded)
          resolve()
        }
      }, 100)

      setTimeout(() => {
        clearInterval(checkLoaded)
        reject(new Error("Timeout waiting for Google Maps to load"))
      }, 10000)
    })
    return googleMapsLoadingPromise
  }

  googleMapsLoadingPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script")
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry&language=${locale}`
    script.async = true
    script.defer = true

    script.onload = () => {
      const checkInit = setInterval(() => {
        if (window.google && window.google.maps && window.google.maps.places && window.google.maps.Geocoder) {
          clearInterval(checkInit)
          resolve()
        }
      }, 50)

      setTimeout(() => {
        clearInterval(checkInit)
        if (window.google && window.google.maps && window.google.maps.places && window.google.maps.Geocoder) {
          resolve()
        } else {
          reject(new Error("Google Maps loaded but required APIs not available"))
        }
      }, 2000)
    }

    script.onerror = () => {
      googleMapsLoadingPromise = null
      reject(new Error("Failed to load Google Maps JavaScript API"))
    }

    document.head.appendChild(script)
  })

  return googleMapsLoadingPromise
}

export default function GoogleMapPicker({
  address,
  onLocationChange,
  locale = "en",
  className = "",
  darkMode = false,
}: GoogleMapPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markerRef = useRef<any>(null)
  const geocoderRef = useRef<any>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)

  // Detect dark mode
  useEffect(() => {
    const checkDarkMode = () => {
      setIsDarkMode(
        darkMode || 
        (typeof window !== "undefined" && document.documentElement.classList.contains("dark"))
      )
    }
    
    checkDarkMode()
    
    // Watch for theme changes
    const observer = new MutationObserver(checkDarkMode)
    if (typeof window !== "undefined") {
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["class"],
      })
    }
    
    return () => observer.disconnect()
  }, [darkMode])

  // Initialize map
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    if (!apiKey || !mapRef.current) return

    loadGoogleMapsScript(apiKey, locale)
      .then(() => {
        setIsLoaded(true)
        setIsLoading(false)

        // Initialize geocoder
        geocoderRef.current = new window.google.maps.Geocoder()

        // Custom map styles - Modern, clean design with dark mode support
        const customMapStyles = isDarkMode
          ? [
              // Dark mode styles
              {
                elementType: "geometry",
                stylers: [{ color: "#1e293b" }], // Dark slate background
              },
              {
                elementType: "labels.text.stroke",
                stylers: [{ color: "#0f172a" }],
              },
              {
                elementType: "labels.text.fill",
                stylers: [{ color: "#cbd5e1" }], // Light text
              },
              {
                featureType: "water",
                elementType: "geometry",
                stylers: [
                  { color: "#1e3a8a" }, // Dark blue water
                  { saturation: -50 },
                ],
              },
              {
                featureType: "road",
                elementType: "geometry",
                stylers: [
                  { color: "#334155" }, // Dark gray roads
                  { lightness: -20 },
                ],
              },
              {
                featureType: "road.highway",
                elementType: "geometry",
                stylers: [
                  { color: "#475569" }, // Lighter for highways
                  { lightness: -10 },
                ],
              },
              {
                featureType: "landscape",
                elementType: "geometry",
                stylers: [
                  { color: "#1e293b" }, // Dark landscape
                  { lightness: -10 },
                ],
              },
              {
                featureType: "administrative",
                elementType: "geometry.stroke",
                stylers: [
                  { color: "#334155" }, // Dark borders
                  { weight: 0.5 },
                ],
              },
              {
                featureType: "poi",
                stylers: [{ visibility: "off" }],
              },
              {
                featureType: "transit",
                stylers: [{ visibility: "off" }],
              },
            ]
          : [
              // Light mode styles - Clean, minimal design
              {
                featureType: "poi",
                elementType: "labels",
                stylers: [{ visibility: "off" }],
              },
              {
                featureType: "water",
                elementType: "geometry",
                stylers: [
                  { color: "#e0f2fe" }, // Light blue water
                  { saturation: -30 },
                  { lightness: 20 },
                ],
              },
              {
                featureType: "road",
                elementType: "geometry",
                stylers: [
                  { color: "#f8fafc" }, // Very light gray roads
                  { lightness: 100 },
                ],
              },
              {
                featureType: "road.highway",
                elementType: "geometry",
                stylers: [
                  { color: "#e2e8f0" }, // Slightly darker for highways
                  { lightness: -5 },
                ],
              },
              {
                featureType: "landscape",
                elementType: "geometry",
                stylers: [
                  { color: "#ffffff" }, // White landscape
                  { lightness: 0 },
                ],
              },
              {
                featureType: "administrative",
                elementType: "geometry.stroke",
                stylers: [
                  { color: "#cbd5e1" }, // Light gray borders
                  { weight: 0.5 },
                  { lightness: 50 },
                ],
              },
              {
                featureType: "administrative.locality",
                elementType: "labels.text.fill",
                stylers: [{ color: "#475569" }], // Dark gray text
              },
              {
                featureType: "road",
                elementType: "labels.text.fill",
                stylers: [{ color: "#64748b" }], // Medium gray for road labels
              },
              {
                featureType: "transit",
                stylers: [{ visibility: "off" }],
              },
            ]

        // Initialize map with custom styles
        mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
          center: { lat: 37.9838, lng: 23.7275 }, // Default to Athens, Greece
          zoom: 13,
          mapTypeControl: false,
          fullscreenControl: true,
          streetViewControl: false,
          zoomControl: true,
          zoomControlOptions: {
            position: window.google.maps.ControlPosition.RIGHT_CENTER,
          },
          styles: customMapStyles,
          // Additional styling options
          disableDefaultUI: false,
          clickableIcons: false,
        })

        // Create custom marker icon (green pin)
        const markerIcon = {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: "#22c55e", // Green color
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 3,
          anchor: new window.google.maps.Point(0, 0),
        }

        // Create marker with custom icon
        markerRef.current = new window.google.maps.Marker({
          map: mapInstanceRef.current,
          draggable: true,
          animation: window.google.maps.Animation.DROP,
          title: "Drag to set your location",
          icon: markerIcon,
          zIndex: 1000,
        })

        // Function to update map position from address
        const updateMapFromAddress = (addr: string) => {
          if (!addr || !geocoderRef.current) return
          
          geocoderRef.current.geocode({ address: addr }, (results: any[], status: string) => {
            if (status === "OK" && results[0]) {
              const location = results[0].geometry.location
              const lat = location.lat()
              const lng = location.lng()
              
              if (mapInstanceRef.current && markerRef.current) {
                mapInstanceRef.current.setCenter({ lat, lng })
                mapInstanceRef.current.setZoom(15)
                markerRef.current.setPosition({ lat, lng })
                setCurrentLocation({ lat, lng })
              }
            }
          })
        }

        // If address is provided, geocode it to set initial position
        if (address) {
          updateMapFromAddress(address)
        } else {
          // Try to get user's current location
          if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
              (position) => {
                const lat = position.coords.latitude
                const lng = position.coords.longitude
                mapInstanceRef.current.setCenter({ lat, lng })
                markerRef.current.setPosition({ lat, lng })
                setCurrentLocation({ lat, lng })
                reverseGeocode(lat, lng)
              },
              () => {
                // If geolocation fails, use default location
                const defaultLat = 37.9838
                const defaultLng = 23.7275
                markerRef.current.setPosition({ lat: defaultLat, lng: defaultLng })
                setCurrentLocation({ lat: defaultLat, lng: defaultLng })
              }
            )
          } else {
            const defaultLat = 37.9838
            const defaultLng = 23.7275
            markerRef.current.setPosition({ lat: defaultLat, lng: defaultLng })
            setCurrentLocation({ lat: defaultLat, lng: defaultLng })
          }
        }

        // Listen for marker drag events
        markerRef.current.addListener("dragstart", () => {
          setIsDragging(true)
        })

        markerRef.current.addListener("dragend", () => {
          setIsDragging(false)
          const position = markerRef.current.getPosition()
          const lat = position.lat()
          const lng = position.lng()
          setCurrentLocation({ lat, lng })
          reverseGeocode(lat, lng)
        })

        // Listen for map clicks to move marker
        mapInstanceRef.current.addListener("click", (e: any) => {
          const lat = e.latLng.lat()
          const lng = e.latLng.lng()
          markerRef.current.setPosition({ lat, lng })
          setCurrentLocation({ lat, lng })
          reverseGeocode(lat, lng)
        })
      })
      .catch((error) => {
        setIsLoading(false)
      })

    // Update map when address changes (from autocomplete)
    return () => {
      // Cleanup if needed
    }
  }, [locale, isDarkMode])

  // Update map styles when dark mode changes
  useEffect(() => {
    if (isLoaded && mapInstanceRef.current) {
      const customMapStyles = isDarkMode
        ? [
            // Dark mode styles
            {
              elementType: "geometry",
              stylers: [{ color: "#1e293b" }],
            },
            {
              elementType: "labels.text.stroke",
              stylers: [{ color: "#0f172a" }],
            },
            {
              elementType: "labels.text.fill",
              stylers: [{ color: "#cbd5e1" }],
            },
            {
              featureType: "water",
              elementType: "geometry",
              stylers: [{ color: "#1e3a8a" }, { saturation: -50 }],
            },
            {
              featureType: "road",
              elementType: "geometry",
              stylers: [{ color: "#334155" }, { lightness: -20 }],
            },
            {
              featureType: "road.highway",
              elementType: "geometry",
              stylers: [{ color: "#475569" }, { lightness: -10 }],
            },
            {
              featureType: "landscape",
              elementType: "geometry",
              stylers: [{ color: "#1e293b" }, { lightness: -10 }],
            },
            {
              featureType: "administrative",
              elementType: "geometry.stroke",
              stylers: [{ color: "#334155" }, { weight: 0.5 }],
            },
            {
              featureType: "poi",
              stylers: [{ visibility: "off" }],
            },
            {
              featureType: "transit",
              stylers: [{ visibility: "off" }],
            },
          ]
        : [
            // Light mode styles
            {
              featureType: "poi",
              elementType: "labels",
              stylers: [{ visibility: "off" }],
            },
            {
              featureType: "water",
              elementType: "geometry",
              stylers: [{ color: "#e0f2fe" }, { saturation: -30 }, { lightness: 20 }],
            },
            {
              featureType: "road",
              elementType: "geometry",
              stylers: [{ color: "#f8fafc" }, { lightness: 100 }],
            },
            {
              featureType: "road.highway",
              elementType: "geometry",
              stylers: [{ color: "#e2e8f0" }, { lightness: -5 }],
            },
            {
              featureType: "landscape",
              elementType: "geometry",
              stylers: [{ color: "#ffffff" }, { lightness: 0 }],
            },
            {
              featureType: "administrative",
              elementType: "geometry.stroke",
              stylers: [{ color: "#cbd5e1" }, { weight: 0.5 }, { lightness: 50 }],
            },
            {
              featureType: "administrative.locality",
              elementType: "labels.text.fill",
              stylers: [{ color: "#475569" }],
            },
            {
              featureType: "road",
              elementType: "labels.text.fill",
              stylers: [{ color: "#64748b" }],
            },
            {
              featureType: "transit",
              stylers: [{ visibility: "off" }],
            },
          ]
      
      mapInstanceRef.current.setOptions({ styles: customMapStyles })
    }
  }, [isDarkMode, isLoaded])

  // Update map position when address changes externally (e.g., from autocomplete)
  useEffect(() => {
    if (isLoaded && address && geocoderRef.current && mapInstanceRef.current && markerRef.current) {
      // Only update if the address changed and we're not currently dragging
      if (!isDragging) {
        geocoderRef.current.geocode({ address }, (results: any[], status: string) => {
          if (status === "OK" && results[0]) {
            const location = results[0].geometry.location
            const lat = location.lat()
            const lng = location.lng()
            
            // Only update if location is significantly different (avoid unnecessary updates)
            if (!currentLocation || 
                Math.abs(currentLocation.lat - lat) > 0.0001 || 
                Math.abs(currentLocation.lng - lng) > 0.0001) {
              mapInstanceRef.current.setCenter({ lat, lng })
              mapInstanceRef.current.setZoom(15)
              markerRef.current.setPosition({ lat, lng })
              setCurrentLocation({ lat, lng })
            }
          }
        })
      }
    }
  }, [address, isLoaded, isDragging, currentLocation])

  // Reverse geocode coordinates to address
  const reverseGeocode = (lat: number, lng: number) => {
    if (!geocoderRef.current) return

    geocoderRef.current.geocode(
      { location: { lat, lng } },
      (results: any[], status: string) => {
        if (status === "OK" && results[0]) {
          const formattedAddress = results[0].formatted_address
          onLocationChange(formattedAddress, lat, lng)
        }
      }
    )
  }

  return (
    <div className={`relative ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 rounded-lg">
          <div className="text-center">
            <svg
              className="mx-auto h-8 w-8 animate-spin text-green-600"
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
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">Loading map...</p>
          </div>
        </div>
      )}
      <div
        ref={mapRef}
        className="w-full h-64 sm:h-80 md:h-96 rounded-lg border-2 border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-lg shadow-zinc-900/5 dark:shadow-zinc-900/20"
        style={{ minHeight: "256px" }}
      />
      {isDragging && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20 bg-green-600 text-white px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg">
          Drop pin to set location
        </div>
      )}
      {!isLoading && isLoaded && (
        <div className="mt-2 text-xs text-zinc-600 dark:text-zinc-400 text-center">
          💡 Drag the pin or click on the map to set your exact location
        </div>
      )}
    </div>
  )
}

