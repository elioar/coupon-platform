import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/auth-helpers"

// GET - List all seed groups
export async function GET(request: NextRequest) {
  try {
    await requireRole(["ADMIN"])

    // Get all unique seed groups with their deal counts
    const seedGroups = await prisma.communityDeal.groupBy({
      by: ["seedGroupId"],
      where: {
        seedGroupId: {
          not: null,
        },
      },
      _count: {
        id: true,
      },
    })

    // Get additional info for each group (first deal's createdAt as group creation date)
    const groupsWithDetails = await Promise.all(
      seedGroups.map(async (group) => {
        const firstDeal = await prisma.communityDeal.findFirst({
          where: {
            seedGroupId: group.seedGroupId,
          },
          orderBy: {
            createdAt: "asc",
          },
          select: {
            createdAt: true,
          },
        })

        return {
          seedGroupId: group.seedGroupId,
          dealCount: group._count.id,
          createdAt: firstDeal?.createdAt || new Date(),
        }
      })
    )

    // Sort by creation date (newest first)
    groupsWithDetails.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

    return NextResponse.json({
      success: true,
      groups: groupsWithDetails,
    })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    console.error("Error fetching seed groups:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

