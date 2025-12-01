import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth-helpers"
import { InviteStatus } from "@prisma/client"
import { fixMissingMembershipRewards } from "@/lib/invite-helpers"

// GET - Get user's invites and stats
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()

    // Automatically check and fix any missing membership rewards for this user
    // This ensures rewards are granted automatically when viewing the refer page
    try {
      await fixMissingMembershipRewards(user.id)
    } catch (error) {
      // Log but don't fail the request if fixing fails
      console.error("Error auto-fixing missing rewards:", error)
    }

    // Get all invites sent by this user
    const invites = await prisma.businessInvite.findMany({
      where: {
        inviterId: user.id,
      },
      include: {
        invitedBusiness: {
          select: {
            id: true,
            name: true,
            email: true,
            createdAt: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    // Count rewards granted (1 month per active invite)
    const activeInvites = invites.filter((invite) => invite.rewardGranted)
    const freeMonthsEarned = activeInvites.length

    // Count by status
    const stats = {
      total: invites.length,
      pending: invites.filter((i) => i.status === InviteStatus.PENDING).length,
      registered: invites.filter((i) => i.status === InviteStatus.REGISTERED).length,
      active: invites.filter((i) => i.status === InviteStatus.ACTIVE).length,
      rewardsGranted: freeMonthsEarned,
    }

    return NextResponse.json({
      invites,
      stats,
    })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.error("Error fetching invites:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

