import { NextRequest, NextResponse } from "next/server"
import { reverseGeocode } from "@/lib/geocoding"

// Coordinates -> address, used when the user drags the map pin.
export async function GET(request: NextRequest) {
  const lat = Number(request.nextUrl.searchParams.get("lat"))
  const lon = Number(request.nextUrl.searchParams.get("lon"))
  const locale = request.nextUrl.searchParams.get("locale") ?? "en"

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return NextResponse.json({ error: "Invalid coordinates" }, { status: 400 })
  }

  try {
    const result = await reverseGeocode(lat, lon, locale)
    return NextResponse.json({ result })
  } catch (error) {
    console.error("Reverse geocode failed:", error)
    return NextResponse.json({ result: null }, { status: 200 })
  }
}
