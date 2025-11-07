import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/auth-helpers"
import { CouponStatus } from "@prisma/client"

// GET - Get dashboard statistics (admin only)
export async function GET(request: NextRequest) {
  try {
    await requireRole(["ADMIN"])

    const [
      totalCoupons,
      pendingCoupons,
      approvedCoupons,
      totalUsers,
      totalBusinesses,
      activeMembers,
    ] = await Promise.all([
      prisma.coupon.count(),
      prisma.coupon.count({ where: { status: CouponStatus.PENDING } }),
      prisma.coupon.count({ where: { status: CouponStatus.APPROVED } }),
      prisma.user.count({ where: { role: "USER" } }),
      prisma.user.count({ where: { role: "BUSINESS" } }),
      prisma.user.count({
        where: {
          membershipExpiry: {
            gte: new Date(),
          },
        },
      }),
    ])

    return NextResponse.json({
      stats: {
        totalCoupons,
        pendingCoupons,
        approvedCoupons,
        totalUsers,
        totalBusinesses,
        activeMembers,
      },
    })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    console.error("Error fetching stats:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

