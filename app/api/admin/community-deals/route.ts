import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/auth-helpers"

// GET - List all community deals (admin only)
export async function GET(request: NextRequest) {
  try {
    await requireRole(["ADMIN"])

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const category = searchParams.get("category")
    const search = searchParams.get("search")

    const where: any = {}

    if (status) {
      where.status = status
    } else {
      // Exclude PENDING and REJECTED deals by default
      // PENDING deals should be shown in community-import page
      // REJECTED deals should not be shown in the main list
      where.status = { 
        notIn: ["PENDING", "REJECTED"]
      }
    }

    if (category) {
      where.category = category
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { location: { contains: search, mode: "insensitive" } },
      ]
    }

    const deals = await prisma.communityDeal.findMany({
      where,
      include: {
        User: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            CommunityDealComment: true,
            CommunityDealVote: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    const dealsWithUser = deals.map((deal) => ({
      ...deal,
      user: deal.User,
      User: undefined,
    }))

    return NextResponse.json({ deals: dealsWithUser })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    console.error("Error fetching community deals:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

