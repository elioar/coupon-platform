import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/auth-helpers"
import { Role } from "@prisma/client"

const SETTINGS_ID = "default"

const DEFAULT_SETTINGS = {
  useRealStats: true,
  fakeTotalCoupons: 0,
  fakeActiveMembers: 0,
  fakeTotalBusinesses: 0,
  fakeTotalSavings: 0,
}

type NumericField = "fakeTotalCoupons" | "fakeActiveMembers" | "fakeTotalBusinesses" | "fakeTotalSavings"

const numericFields: NumericField[] = [
  "fakeTotalCoupons",
  "fakeActiveMembers",
  "fakeTotalBusinesses",
  "fakeTotalSavings",
]

function sanitizeInt(value: unknown) {
  if (value === undefined || value === null || value === "") return undefined
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return undefined
  return Math.max(0, Math.round(parsed))
}

async function getOrCreateSettings() {
  return prisma.siteSettings.upsert({
    where: { id: SETTINGS_ID },
    update: {},
    create: { 
      id: SETTINGS_ID, 
      ...DEFAULT_SETTINGS,
      updatedAt: new Date(),
    },
  })
}

// GET - Fetch platform settings (admin only)
export async function GET() {
  try {
    await requireRole([Role.ADMIN])
    const settings = await getOrCreateSettings()
    return NextResponse.json({ settings })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    console.error("Error fetching settings:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// PUT - Update platform settings (admin only)
export async function PUT(request: NextRequest) {
  try {
    await requireRole([Role.ADMIN])

    const body = (await request.json().catch(() => ({}))) as {
      useRealStats?: boolean
      mode?: "real" | "custom"
      fakeTotalCoupons?: number
      fakeActiveMembers?: number
      fakeTotalBusinesses?: number
      fakeTotalSavings?: number
    }

    const updates: Partial<typeof DEFAULT_SETTINGS> = {}

    if (typeof body.useRealStats === "boolean") {
      updates.useRealStats = body.useRealStats
    } else if (body.mode === "real" || body.mode === "custom") {
      updates.useRealStats = body.mode === "real"
    }

    numericFields.forEach((field) => {
      const parsedValue = sanitizeInt(body[field])
      if (parsedValue !== undefined) {
        updates[field] = parsedValue
      }
    })

    const settings = await prisma.siteSettings.upsert({
      where: { id: SETTINGS_ID },
      update: updates,
      create: { 
        id: SETTINGS_ID, 
        ...DEFAULT_SETTINGS, 
        ...updates,
        updatedAt: new Date(),
      },
    })

    return NextResponse.json({ settings })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    console.error("Error updating settings:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

