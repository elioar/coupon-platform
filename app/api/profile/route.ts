import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth-helpers"
import { Role } from "@prisma/client"

const profileSchema = z.object({
  name: z.string().min(2).max(120),
  address: z.string().max(200).optional().nullable(),
  birthDate: z.string().optional().nullable(),
  phone: z.string().max(40).optional().nullable(),
  about: z.string().max(1000).optional().nullable(),
  businessDescription: z.string().max(2000).optional().nullable(),
  businessCategories: z.array(z.string().max(80)).optional(),
  businessLocation: z.string().max(200).optional().nullable(),
  businessLatitude: z.number().optional().nullable(),
  businessLongitude: z.number().optional().nullable(),
  businessWebsite: z
    .string()
    .url()
    .optional()
    .or(z.literal(""))
    .or(z.null()),
  businessInstagram: z
    .string()
    .url()
    .optional()
    .or(z.literal(""))
    .or(z.null()),
  businessFacebook: z
    .string()
    .url()
    .optional()
    .or(z.literal(""))
    .or(z.null()),
  businessTikTok: z
    .string()
    .url()
    .optional()
    .or(z.literal(""))
    .or(z.null()),
})

const userSelect = {
  id: true,
  email: true,
  name: true,
  role: true,
  membershipExpiry: true,
  address: true,
  birthDate: true,
  phone: true,
  about: true,
  businessDescription: true,
  businessCategories: true,
  businessLocation: true,
  businessWebsite: true,
  businessInstagram: true,
  businessFacebook: true,
  businessTikTok: true,
  businessLatitude: true,
  businessLongitude: true,
} as const

async function geocodeAddress(address: string, locale: string) {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY
  
  if (!apiKey) {
    console.error("GOOGLE_MAPS_API_KEY is not set")
    throw new Error("Google Maps API key is not configured")
  }

  // Convert locale to Google Maps language code (e.g., "el" -> "el", "en" -> "en")
  const language = locale === "el" ? "el" : "en"
  
  const url = new URL("https://maps.googleapis.com/maps/api/geocode/json")
  url.searchParams.set("address", address)
  url.searchParams.set("key", apiKey)
  url.searchParams.set("language", language)

  const response = await fetch(url.toString(), {
    next: { revalidate: 0 },
  })

  if (!response.ok) {
    throw new Error("Failed to geocode address")
  }

  const data = await response.json()
  
  // Check for API errors
  if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
    console.error("Google Maps Geocoding API error:", data.status, data.error_message)
    throw new Error(`Geocoding failed: ${data.status}`)
  }

  // Handle no results
  if (data.status === "ZERO_RESULTS" || !data.results || data.results.length === 0) {
    return null
  }

  // Get the first result (most relevant)
  const result = data.results[0]
  const location = result.geometry.location
  
  const latitude = location.lat
  const longitude = location.lng

  if (typeof latitude !== "number" || typeof longitude !== "number") {
    return null
  }

  return { latitude, longitude }
}

export async function GET() {
  try {
    const user = await requireAuth()

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: userSelect,
    })

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({
      profile: {
        ...dbUser,
        birthDate: dbUser.birthDate?.toISOString() ?? null,
      },
    })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.error("Profile GET error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const payload = profileSchema.parse(body)
    const preferredLanguage = request.headers.get("accept-language") ?? "en"

    const updateData: Record<string, any> = {
      name: payload.name,
      address: payload.address ?? null,
      birthDate: payload.birthDate ? new Date(payload.birthDate) : null,
      phone: payload.phone ?? null,
      about: payload.about ?? null,
      businessDescription: payload.businessDescription ?? null,
      businessCategories: {
        set: payload.businessCategories ?? [],
      },
      businessLocation: payload.businessLocation ?? null,
      businessWebsite: payload.businessWebsite || null,
      businessInstagram: payload.businessInstagram || null,
      businessFacebook: payload.businessFacebook || null,
      businessTikTok: payload.businessTikTok || null,
    }

    // Use provided coordinates if available (from Google Map Picker), otherwise geocode the address
    let nextLatitude: number | null | undefined = undefined
    let nextLongitude: number | null | undefined = undefined

    // If coordinates are provided directly (from map picker), use them
    if (user.role === Role.BUSINESS && payload.businessLatitude != null && payload.businessLongitude != null) {
      nextLatitude = payload.businessLatitude
      nextLongitude = payload.businessLongitude
      console.log("✅ Using provided coordinates from map picker:", { lat: nextLatitude, lng: nextLongitude })
    } else if (user.role === Role.BUSINESS) {
      // Otherwise, try to geocode the address
      const locationForGeocode =
        payload.businessLocation?.trim() ||
        payload.address?.trim() ||
        null

      if (locationForGeocode) {
        try {
          console.log("🔄 Geocoding address:", locationForGeocode)
          const coordinates = await geocodeAddress(locationForGeocode, preferredLanguage)
          if (coordinates) {
            nextLatitude = coordinates.latitude
            nextLongitude = coordinates.longitude
            console.log("✅ Geocoded successfully:", { lat: nextLatitude, lng: nextLongitude })
          } else {
            console.warn("⚠️ Geocoding returned no coordinates for:", locationForGeocode)
            nextLatitude = null
            nextLongitude = null
          }
        } catch (geocodeError) {
          console.error("❌ Failed to geocode business location:", geocodeError)
          nextLatitude = null
          nextLongitude = null
        }
      } else {
        // No location provided, clear coordinates
        console.log("ℹ️ No location provided, clearing coordinates")
        nextLatitude = null
        nextLongitude = null
      }
    }

    // Update coordinates if they were determined
    if (nextLatitude !== undefined && nextLongitude !== undefined) {
      updateData.businessLatitude = nextLatitude
      updateData.businessLongitude = nextLongitude
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
      select: userSelect,
    })

    return NextResponse.json({
      profile: {
        ...updatedUser,
        birthDate: updatedUser.birthDate?.toISOString() ?? null,
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      )
    }

    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.error("Profile PUT error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
