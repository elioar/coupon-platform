import { NextRequest, NextResponse } from "next/server"
import { searchAddress } from "@/lib/geocoding"

// Address autocomplete. Public on purpose: the business registration form uses it
// before the user has an account.
export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q") ?? ""
  const locale = request.nextUrl.searchParams.get("locale") ?? "en"

  if (query.trim().length < 3) {
    return NextResponse.json({ results: [] })
  }

  try {
    const results = await searchAddress(query, locale)
    return NextResponse.json({ results })
  } catch (error) {
    console.error("Address search failed:", error)
    return NextResponse.json({ results: [] }, { status: 200 })
  }
}
