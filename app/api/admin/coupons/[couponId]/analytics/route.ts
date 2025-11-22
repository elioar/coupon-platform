import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/auth-helpers"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ couponId: string }> }
) {
  try {
    await requireRole(["ADMIN"])

    const { couponId } = await params

    // Get analytics counts for this coupon
    const [views, clicks, redemptions, saves] = await Promise.all([
      prisma.couponAnalytics.count({
        where: {
          couponId,
          eventType: "VIEW"
        }
      }),
      prisma.couponAnalytics.count({
        where: {
          couponId,
          eventType: "CLICK"
        }
      }),
      prisma.couponAnalytics.count({
        where: {
          couponId,
          eventType: "REDEMPTION"
        }
      }),
      prisma.couponAnalytics.count({
        where: {
          couponId,
          eventType: "SAVE"
        }
      })
    ])

    return NextResponse.json({
      views,
      clicks,
      redemptions,
      saves
    })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    console.error("Error fetching coupon analytics:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

