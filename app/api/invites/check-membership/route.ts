import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth-helpers"
import { fixMissingMembershipRewards } from "@/lib/invite-helpers"

// POST - Check user's membership status and fix if needed (changed to POST to avoid caching)
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()

    // Get user with invites
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        membershipExpiry: true,
        BusinessInvite_BusinessInvite_inviterIdToUser: {
          where: {
            rewardGranted: true,
            status: "ACTIVE",
          },
        },
      },
    })

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const now = new Date()
    const hasActiveMembership = dbUser.membershipExpiry && new Date(dbUser.membershipExpiry) > now
    const rewardsGranted = dbUser.BusinessInvite_BusinessInvite_inviterIdToUser.length

    // ALWAYS try to fix if user has rewards granted, regardless of current membership status
    // This ensures we grant the full amount even if they have partial membership
    if (rewardsGranted > 0) {
      // Fix missing memberships for this specific user
      const fixedCount = await fixMissingMembershipRewards(user.id)
      
      // Fetch updated user to verify fix
      const updatedUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: {
          membershipExpiry: true,
        },
      })

      const wasFixed = updatedUser?.membershipExpiry && new Date(updatedUser.membershipExpiry) > new Date()

      return NextResponse.json({
        fixed: wasFixed,
        fixedCount: wasFixed ? fixedCount : 0,
        previousMembershipExpiry: dbUser.membershipExpiry?.toISOString() || null,
        newMembershipExpiry: updatedUser?.membershipExpiry?.toISOString() || null,
        rewardsGranted,
        debug: {
          hadRewards: rewardsGranted > 0,
          hadActiveMembership: hasActiveMembership,
          fixedCount,
          wasFixed,
          previousExpiry: dbUser.membershipExpiry?.toISOString(),
          newExpiry: updatedUser?.membershipExpiry?.toISOString(),
        },
      })
    }

    return NextResponse.json({
      fixed: false,
      membershipExpiry: dbUser.membershipExpiry?.toISOString() || null,
      hasActiveMembership,
      rewardsGranted,
      message: "No rewards granted to fix",
    })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.error("Error checking membership:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

// Also support GET for backwards compatibility
export async function GET(request: NextRequest) {
  return POST(request)
}

