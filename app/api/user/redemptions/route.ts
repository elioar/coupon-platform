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
        Coupon: {
          include: {
            Category: {
              select: {
                id: true,
                nameEn: true,
                nameEl: true
              }
            },
            User: {
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
        couponTitle: r.Coupon.title,
        couponCode: r.Coupon.code || null,
        discountPercentage: r.Coupon.discountPercentage,
        imagePath: r.Coupon.imagePath,
        category: r.Coupon.Category,
        business: r.Coupon.User,
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

