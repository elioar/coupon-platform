import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/auth-helpers"

// DELETE - Delete a seed group (all deals with this seedGroupId)
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ groupId: string }> }
) {
  try {
    await requireRole(["ADMIN"])

    const { groupId } = await context.params

    if (!groupId) {
      return NextResponse.json({ error: "Group ID is required" }, { status: 400 })
    }

    // Find all deals with this seedGroupId
    const deals = await prisma.communityDeal.findMany({
      where: {
        seedGroupId: groupId,
      },
      select: {
        id: true,
      },
    })

    if (deals.length === 0) {
      return NextResponse.json({ error: "Seed group not found" }, { status: 404 })
    }

    // Delete all deals (cascade will handle comments and votes)
    const dealIds = deals.map((d) => d.id)
    await prisma.communityDeal.deleteMany({
      where: {
        id: {
          in: dealIds,
        },
      },
    })

    return NextResponse.json({
      success: true,
      message: `Deleted ${deals.length} deals from seed group`,
      dealsDeleted: deals.length,
    })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    console.error("Error deleting seed group:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

