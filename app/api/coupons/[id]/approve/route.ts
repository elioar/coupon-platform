import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/auth-helpers"
import { CouponStatus } from "@prisma/client"
import { z } from "zod"

const approvalSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
})

// POST - Approve or reject coupon (admin only)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(["ADMIN"])

    const { id } = await params
    const body = await request.json()
    const { status } = approvalSchema.parse(body)

    const coupon = await prisma.coupon.findUnique({
      where: { id },
    })

    if (!coupon) {
      return NextResponse.json({ error: "Coupon not found" }, { status: 404 })
    }

    const updatedCoupon = await prisma.coupon.update({
      where: { id },
      data: {
        status: status as CouponStatus,
      },
      include: {
        business: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        category: true,
      },
    })

    return NextResponse.json({
      message: `Coupon ${status.toLowerCase()} successfully`,
      coupon: updatedCoupon,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      )
    }

    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    console.error("Error approving/rejecting coupon:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

