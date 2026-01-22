import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/auth-helpers"
import { CommunityDealStatus } from "@prisma/client"

// GET - List pending deals
export async function GET(request: NextRequest) {
  try {
    await requireRole(["ADMIN"])

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1", 10)
    const limit = parseInt(searchParams.get("limit") || "20", 10)
    const skip = (page - 1) * limit

    const [deals, total] = await Promise.all([
      prisma.communityDeal.findMany({
        where: {
          status: CommunityDealStatus.PENDING,
        },
        include: {
          User: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take: limit,
      }),
      prisma.communityDeal.count({
        where: {
          status: CommunityDealStatus.PENDING,
        },
      }),
    ])

    const dealsWithUser = deals.map((deal) => ({
      ...deal,
      user: deal.User,
      User: undefined,
    }))

    return NextResponse.json({
      deals: dealsWithUser,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    console.error("Error fetching pending deals:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
