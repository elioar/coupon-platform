/**
 * Geocoding via Nominatim (OpenStreetMap). No API key, no billing.
 *
 * Nominatim's usage policy requires an identifying User-Agent and allows at most
 * 1 request/second, so every call goes through the server (never the browser
 * directly) and callers are expected to debounce.
 * https://operations.osmfoundation.org/policies/nominatim/
 */

const NOMINATIM_BASE = "https://nominatim.openstreetmap.org"

const USER_AGENT = `VibePeek/1.0 (${process.env.NEXT_PUBLIC_APP_URL || "https://vibepeek.com"})`

export interface GeocodeResult {
  /** Full human-readable address */
  address: string
  latitude: number
  longitude: number
  city: string | null
  postalCode: string | null
}

type NominatimAddress = {
  house_number?: string
  road?: string
  city?: string
  town?: string
  village?: string
  municipality?: string
  suburb?: string
  county?: string
  postcode?: string
  country?: string
}

/** Longest address we store; `businessLocation` is capped at 200 chars. */
const MAX_ADDRESS_LENGTH = 200

interface NominatimPlace {
  display_name?: string
  lat?: string
  lon?: string
  address?: NominatimAddress
}

function toLanguage(locale: string) {
  return locale === "el" ? "el" : "en"
}

/** Greek OSM data labels cities as e.g. "Thessaloniki Municipal Unit" - drop the admin suffix. */
function cleanCityName(value: string): string {
  return value
    .replace(/^Municipality of\s+/i, "")
    .replace(/\s+(Municipal Unit|Regional Unit)$/i, "")
    .trim()
}

function pickCity(address: NominatimAddress | undefined): string | null {
  if (!address) return null

  const raw =
    address.city ||
    address.town ||
    address.village ||
    address.municipality ||
    address.suburb ||
    address.county

  if (!raw) return null

  return cleanCityName(raw) || null
}

/**
 * Nominatim's `display_name` is unusably verbose ("...4th District of Thessaloniki,
 * Thessaloniki Municipal Unit, Municipality of Thessaloniki, Thessaloniki Regional
 * Unit, Central Macedonia, Macedonia and Thrace, 543 51, Greece"), and long enough to
 * blow past the 200-char column limit. Rebuild a short "street, postcode city, country".
 */
function formatAddress(place: NominatimPlace): string {
  const address = place.address
  if (!address) return (place.display_name ?? "").slice(0, MAX_ADDRESS_LENGTH)

  const street = [address.road, address.house_number].filter(Boolean).join(" ")
  const cityLine = [address.postcode, pickCity(address)].filter(Boolean).join(" ")

  const formatted = [street, cityLine, address.country]
    .filter((part) => part && part.trim().length > 0)
    .join(", ")

  return (formatted || place.display_name || "").slice(0, MAX_ADDRESS_LENGTH)
}

function toResult(place: NominatimPlace): GeocodeResult | null {
  const latitude = Number(place.lat)
  const longitude = Number(place.lon)

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null

  return {
    address: formatAddress(place),
    latitude,
    longitude,
    city: pickCity(place.address),
    postalCode: place.address?.postcode ?? null,
  }
}

async function nominatimFetch(path: string, params: Record<string, string>) {
  const url = new URL(`${NOMINATIM_BASE}${path}`)
  url.searchParams.set("format", "jsonv2")
  url.searchParams.set("addressdetails", "1")
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value)
  }

  const response = await fetch(url.toString(), {
    headers: { "User-Agent": USER_AGENT },
    // Nominatim is rate-limited; cache identical lookups for an hour.
    next: { revalidate: 3600 },
  })

  if (!response.ok) {
    throw new Error(`Nominatim request failed: ${response.status}`)
  }

  return response.json()
}

/** Free-text address search — used for autocomplete suggestions. */
export async function searchAddress(
  query: string,
  locale: string = "en",
  limit: number = 5
): Promise<GeocodeResult[]> {
  if (query.trim().length < 3) return []

  const data: NominatimPlace[] = await nominatimFetch("/search", {
    q: query,
    limit: String(limit),
    "accept-language": toLanguage(locale),
  })

  if (!Array.isArray(data)) return []

  return data.map(toResult).filter((r): r is GeocodeResult => r !== null)
}

/** Coordinates -> address. Used when the user drags the map pin. */
export async function reverseGeocode(
  latitude: number,
  longitude: number,
  locale: string = "en"
): Promise<GeocodeResult | null> {
  const data: NominatimPlace = await nominatimFetch("/reverse", {
    lat: String(latitude),
    lon: String(longitude),
    "accept-language": toLanguage(locale),
  })

  if (!data || !data.lat) return null

  return toResult(data)
}

/** Address -> coordinates. Drop-in replacement for the old Google geocoder. */
export async function geocodeAddress(
  address: string,
  locale: string = "en"
): Promise<{ latitude: number; longitude: number } | null> {
  const results = await searchAddress(address, locale, 1)
  if (results.length === 0) return null

  return { latitude: results[0].latitude, longitude: results[0].longitude }
}
