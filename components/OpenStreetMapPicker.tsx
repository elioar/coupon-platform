"use client"

import { useEffect, useRef, useState } from "react"
import type * as LeafletTypes from "leaflet"
import "leaflet/dist/leaflet.css"

interface LocationDetails {
  city: string | null
  postalCode: string | null
}

interface OpenStreetMapPickerProps {
  address: string
  onLocationChange: (
    address: string,
    lat: number,
    lng: number,
    details?: LocationDetails
  ) => void
  locale?: string
  className?: string
  darkMode?: boolean
}

const DEFAULT_CENTER: [number, number] = [37.9838, 23.7275] // Athens
const DEFAULT_ZOOM = 13

const TILES = {
  light: {
    url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
  },
  dark: {
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
  },
}

// A green pin drawn in HTML so we don't depend on Leaflet's default icon assets,
// which break under bundlers.
const MARKER_HTML = `
  <div style="position:relative;width:24px;height:24px;">
    <span style="position:absolute;inset:0;border-radius:9999px;background:#22c55e;opacity:.35;animation:vp-pulse 2s ease-in-out infinite;"></span>
    <span style="position:absolute;inset:5px;border-radius:9999px;background:#22c55e;border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.35);"></span>
  </div>
  <style>@keyframes vp-pulse{0%,100%{transform:scale(1);opacity:.35}50%{transform:scale(1.4);opacity:.1}}</style>
`

export default function OpenStreetMapPicker({
  address,
  onLocationChange,
  locale = "en",
  className = "",
  darkMode = false,
}: OpenStreetMapPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const leafletRef = useRef<typeof LeafletTypes | null>(null)
  const mapInstanceRef = useRef<LeafletTypes.Map | null>(null)
  const markerRef = useRef<LeafletTypes.Marker | null>(null)
  const tileLayerRef = useRef<LeafletTypes.TileLayer | null>(null)

  // The last address this component itself produced, so an address prop change
  // caused by our own reverse-geocode doesn't trigger a forward-geocode loop.
  const selfEmittedAddressRef = useRef<string | null>(null)

  const [isLoading, setIsLoading] = useState(true)
  const [isDarkMode, setIsDarkMode] = useState(darkMode)

  useEffect(() => {
    const checkDarkMode = () => {
      setIsDarkMode(
        darkMode ||
          (typeof window !== "undefined" &&
            document.documentElement.classList.contains("dark"))
      )
    }

    checkDarkMode()
    const observer = new MutationObserver(checkDarkMode)
    if (typeof window !== "undefined") {
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["class"],
      })
    }
    return () => observer.disconnect()
  }, [darkMode])

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const response = await fetch(
        `/api/geocode/reverse?lat=${lat}&lon=${lng}&locale=${locale}`
      )
      if (!response.ok) return

      const { result } = await response.json()
      if (!result) return

      selfEmittedAddressRef.current = result.address
      onLocationChange(result.address, lat, lng, {
        city: result.city,
        postalCode: result.postalCode,
      })
    } catch {
      // Network hiccup - keep the pin where the user put it.
    }
  }

  // Initialise the map once.
  useEffect(() => {
    let cancelled = false

    const init = async () => {
      if (!mapRef.current || mapInstanceRef.current) return

      const L = (await import("leaflet")).default
      if (cancelled || !mapRef.current) return
      leafletRef.current = L

      const map = L.map(mapRef.current, {
        center: DEFAULT_CENTER,
        zoom: DEFAULT_ZOOM,
        zoomControl: true,
        scrollWheelZoom: true,
      })
      mapInstanceRef.current = map

      const theme = isDarkMode ? TILES.dark : TILES.light
      tileLayerRef.current = L.tileLayer(theme.url, {
        attribution: theme.attribution,
        maxZoom: 19,
      }).addTo(map)

      const icon = L.divIcon({
        html: MARKER_HTML,
        className: "",
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      })

      const marker = L.marker(DEFAULT_CENTER, { draggable: true, icon }).addTo(map)
      markerRef.current = marker

      marker.on("dragend", () => {
        const { lat, lng } = marker.getLatLng()
        void reverseGeocode(lat, lng)
      })

      map.on("click", (event: LeafletTypes.LeafletMouseEvent) => {
        const { lat, lng } = event.latlng
        marker.setLatLng([lat, lng])
        void reverseGeocode(lat, lng)
      })

      setIsLoading(false)

      // No address yet? Try the browser's location as a starting point.
      if (!address && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((position) => {
          if (cancelled || !mapInstanceRef.current) return
          const { latitude, longitude } = position.coords
          mapInstanceRef.current.setView([latitude, longitude], 15)
          markerRef.current?.setLatLng([latitude, longitude])
          void reverseGeocode(latitude, longitude)
        })
      }
    }

    void init()

    return () => {
      cancelled = true
      mapInstanceRef.current?.remove()
      mapInstanceRef.current = null
      markerRef.current = null
      tileLayerRef.current = null
    }
    // Intentionally mount-only: the map is imperatively updated by the effects below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Swap tiles when the theme changes.
  useEffect(() => {
    const L = leafletRef.current
    const map = mapInstanceRef.current
    if (!L || !map) return

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current)
    }

    const theme = isDarkMode ? TILES.dark : TILES.light
    tileLayerRef.current = L.tileLayer(theme.url, {
      attribution: theme.attribution,
      maxZoom: 19,
    }).addTo(map)
  }, [isDarkMode])

  // Recentre when the address is changed from outside (e.g. the autocomplete).
  useEffect(() => {
    const map = mapInstanceRef.current
    const marker = markerRef.current
    if (!map || !marker) return

    const query = address.trim()
    if (query.length < 3) return
    if (query === selfEmittedAddressRef.current) return

    const controller = new AbortController()
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/geocode/search?q=${encodeURIComponent(query)}&locale=${locale}`,
          { signal: controller.signal }
        )
        if (!response.ok) return

        const { results } = await response.json()
        if (!results?.length) return

        const { latitude, longitude } = results[0]
        map.setView([latitude, longitude], 15)
        marker.setLatLng([latitude, longitude])
      } catch {
        // Aborted or failed - leave the map where it is.
      }
    }, 500)

    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [address, locale])

  return (
    <div className={`relative ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 z-[500] flex items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
          <div className="text-center">
            <svg className="mx-auto h-8 w-8 animate-spin text-green-600" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
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
        className="h-64 w-full overflow-hidden rounded-lg border-2 border-zinc-200 shadow-lg shadow-zinc-900/5 sm:h-80 md:h-96 dark:border-zinc-800 dark:shadow-zinc-900/20"
        style={{ minHeight: "256px" }}
      />

      {!isLoading && (
        <div className="mt-2 text-center text-xs text-zinc-600 dark:text-zinc-400">
          💡 Drag the pin or click on the map to set your exact location
        </div>
      )}
    </div>
  )
}
