import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"

// GET - Get current membership status directly from database (bypasses session cache)
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        membershipExpiry: true,
      },
    })

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const now = new Date()
    const hasActiveMembership = dbUser.membershipExpiry && new Date(dbUser.membershipExpiry) > now

    return NextResponse.json({
      membershipExpiry: dbUser.membershipExpiry?.toISOString() || null,
      hasActiveMembership,
    })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

