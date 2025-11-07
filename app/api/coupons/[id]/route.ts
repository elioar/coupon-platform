import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth, requireRole } from "@/lib/auth-helpers"
import { z } from "zod"

const updateCouponSchema = z.object({
  title: z.string().min(3).max(200).optional(),
  description: z.string().min(10).optional(),
  code: z.string().min(3).max(50).optional(),
  categoryId: z.string().optional(),
  discountPercentage: z.number().min(1).max(100).optional(),
  expirationDate: z.string().datetime().optional(),
  imagePath: z.string().optional(),
  status: z.enum(["PENDING", "APPROVED", "REJECTED"]).optional(),
})

// GET - Get single coupon
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const coupon = await prisma.coupon.findUnique({
      where: { id },
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

    if (!coupon) {
      return NextResponse.json({ error: "Coupon not found" }, { status: 404 })
    }

    return NextResponse.json({ coupon })
  } catch (error) {
    console.error("Error fetching coupon:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// PATCH - Update coupon (business owner or admin)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const { id } = await params

    const coupon = await prisma.coupon.findUnique({
      where: { id },
    })

    if (!coupon) {
      return NextResponse.json({ error: "Coupon not found" }, { status: 404 })
    }

    // Check permissions: must be the coupon owner or admin
    if (user.role !== "ADMIN" && coupon.businessId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = updateCouponSchema.parse(body)

    const updateData: any = { ...validatedData }
    if (validatedData.expirationDate) {
      updateData.expirationDate = new Date(validatedData.expirationDate)
    }

    const updatedCoupon = await prisma.coupon.update({
      where: { id },
      data: updateData,
      include: {
        business: {
          select: {
            id: true,
            name: true,
          },
        },
        category: true,
      },
    })

    return NextResponse.json({
      message: "Coupon updated successfully",
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

    console.error("Error updating coupon:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// DELETE - Delete coupon (business owner or admin)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const { id } = await params

    const coupon = await prisma.coupon.findUnique({
      where: { id },
    })

    if (!coupon) {
      return NextResponse.json({ error: "Coupon not found" }, { status: 404 })
    }

    // Check permissions: must be the coupon owner or admin
    if (user.role !== "ADMIN" && coupon.businessId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    await prisma.coupon.delete({
      where: { id },
    })

    return NextResponse.json({ message: "Coupon deleted successfully" })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.error("Error deleting coupon:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

