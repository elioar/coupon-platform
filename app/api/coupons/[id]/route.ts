import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth, requireRole } from "@/lib/auth-helpers"
import { z } from "zod"
import { CouponType, UsageLimitType } from "@prisma/client"

const updateCouponSchema = z.object({
  title: z.string().min(3).max(200).optional(),
  description: z.string().min(10).optional(),
  code: z.preprocess(
    (val) => (val === "" || val === null ? undefined : val),
    z.string().min(3).max(50).optional()
  ),
  couponType: z.nativeEnum(CouponType).optional(),
  categoryId: z.string().optional(),
  discountPercentage: z.number().min(1).max(100).optional(),
  expirationDate: z.string().datetime().optional(),
  imagePath: z.string().optional(),
  status: z.enum(["PENDING", "APPROVED", "REJECTED"]).optional(),
  usageLimitType: z.nativeEnum(UsageLimitType).optional(),
  maxUsesPerUser: z.number().min(1).optional(),
  hasTimeRestrictions: z.boolean().optional(),
  validDays: z.array(z.number().min(0).max(6)).optional(),
  validStartHour: z.number().min(0).max(23).optional(),
  validEndHour: z.number().min(0).max(23).optional(),
}).refine((data) => {
  // If couponType is ONLINE_CODE, code is required
  if (data.couponType === CouponType.ONLINE_CODE && data.code !== undefined) {
    return data.code && data.code.trim().length >= 3
  }
  return true
}, {
  message: "Code is required for online coupons",
  path: ["code"]
}).refine((data) => {
  // If usageLimitType is MULTIPLE_USE, maxUsesPerUser must be provided and >= 1
  if (data.usageLimitType === UsageLimitType.MULTIPLE_USE && data.maxUsesPerUser !== undefined) {
    return data.maxUsesPerUser >= 1
  }
  return true
}, {
  message: "Max uses per user must be at least 1",
  path: ["maxUsesPerUser"]
}).refine((data) => {
  // If hasTimeRestrictions is true, validDays must have at least one day
  if (data.hasTimeRestrictions === true && data.validDays !== undefined) {
    return data.validDays.length > 0
  }
  return true
}, {
  message: "At least one day must be selected when time restrictions are enabled",
  path: ["validDays"]
}).refine((data) => {
  // If hasTimeRestrictions is true, both validStartHour and validEndHour must be provided
  if (data.hasTimeRestrictions === true) {
    return data.validStartHour !== undefined && data.validEndHour !== undefined
  }
  return true
}, {
  message: "Start hour and end hour are required when time restrictions are enabled",
  path: ["validStartHour"]
}).refine((data) => {
  // validStartHour must be < validEndHour
  if (data.hasTimeRestrictions === true && data.validStartHour !== undefined && data.validEndHour !== undefined) {
    return data.validStartHour < data.validEndHour
  }
  return true
}, {
  message: "Start hour must be less than end hour",
  path: ["validStartHour"]
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
    // Handle code based on couponType
    if (validatedData.couponType !== undefined) {
      if (validatedData.couponType === CouponType.QR_CODE) {
        updateData.code = undefined
      } else if (validatedData.couponType === CouponType.ONLINE_CODE && !validatedData.code) {
        // If switching to ONLINE_CODE but no code provided, keep existing code or require it
        // The validation schema will handle this
      }
    }
    // Convert empty string to undefined for optional imagePath
    if (validatedData.imagePath !== undefined) {
      updateData.imagePath = validatedData.imagePath && validatedData.imagePath.trim() !== '' 
        ? validatedData.imagePath 
        : undefined
    }
    // Convert empty string to undefined for optional code
    if (validatedData.code !== undefined) {
      updateData.code = validatedData.code && validatedData.code.trim() !== '' 
        ? validatedData.code 
        : undefined
    }
    // Handle usage limit fields
    if (validatedData.usageLimitType !== undefined) {
      updateData.usageLimitType = validatedData.usageLimitType
      if (validatedData.usageLimitType === UsageLimitType.MULTIPLE_USE) {
        updateData.maxUsesPerUser = validatedData.maxUsesPerUser
      } else {
        updateData.maxUsesPerUser = undefined
      }
    }
    // Handle time restriction fields
    if (validatedData.hasTimeRestrictions !== undefined) {
      updateData.hasTimeRestrictions = validatedData.hasTimeRestrictions
      if (validatedData.hasTimeRestrictions) {
        updateData.validDays = validatedData.validDays || []
        updateData.validStartHour = validatedData.validStartHour
        updateData.validEndHour = validatedData.validEndHour
      } else {
        updateData.validDays = []
        updateData.validStartHour = undefined
        updateData.validEndHour = undefined
      }
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

