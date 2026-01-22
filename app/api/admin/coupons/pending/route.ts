import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/auth-helpers"
import { CouponStatus } from "@prisma/client"

// GET - List all pending coupons (admin only)
export async function GET(request: NextRequest) {
  try {
    await requireRole(["ADMIN"])

    const coupons = await prisma.coupon.findMany({
      where: {
        status: CouponStatus.PENDING,
      },
      include: {
        User: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        Category: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    })

    const couponsWithBusiness = coupons.map((coupon) => ({
      ...coupon,
      business: coupon.User,
      category: coupon.Category,
      User: undefined,
      Category: undefined,
    }))

    return NextResponse.json({ coupons: couponsWithBusiness })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    console.error("Error fetching pending coupons:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

