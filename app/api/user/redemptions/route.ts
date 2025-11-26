import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/auth-helpers"

export async function GET(request: NextRequest) {
  try {
    const user = await requireRole(["USER"])
    
    // Get user's redemption events
    const redemptions = await prisma.couponAnalytics.findMany({
      where: {
        userId: user.id,
        eventType: "REDEMPTION"
      },
      include: {
        coupon: {
          include: {
            category: {
              select: {
                id: true,
                nameEn: true,
                nameEl: true
              }
            },
            business: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      },
      take: 10 // Get last 10 redemptions
    })

    return NextResponse.json({
      redemptions: redemptions.map(r => ({
        id: r.id,
        couponId: r.couponId,
        couponTitle: r.coupon.title,
        couponCode: r.coupon.code || null,
        discountPercentage: r.coupon.discountPercentage,
        imagePath: r.coupon.imagePath,
        category: r.coupon.category,
        business: r.coupon.business,
        redeemedAt: r.createdAt
      }))
    })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    console.error("Error fetching redemptions:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

