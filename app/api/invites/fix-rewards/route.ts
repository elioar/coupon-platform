import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-helpers"
import { fixMissingMembershipRewards } from "@/lib/invite-helpers"

// POST - Fix missing membership rewards (admin only, or can be called by user to fix their own)
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()

    // Fix missing memberships for rewards that were granted but membership wasn't updated
    const fixedCount = await fixMissingMembershipRewards()

    return NextResponse.json({
      message: `Fixed ${fixedCount} missing membership reward(s)`,
      fixedCount,
    })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.error("Error fixing rewards:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

