import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth, requireRole } from "@/lib/auth-helpers"
import { z } from "zod"
import { CouponStatus, CouponType, UsageLimitType, DiscountType } from "@prisma/client"

const createCouponSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().min(10),
  code: z.preprocess(
    (val) => (val === "" || val === null ? undefined : val),
    z.string().min(3).max(50).optional()
  ),
  couponType: z.nativeEnum(CouponType).default(CouponType.ONLINE_CODE),
  categoryId: z.string(),
  discountType: z.nativeEnum(DiscountType).default(DiscountType.PERCENT),
  discountPercentage: z.number().min(1).max(100).optional(),
  discountAmount: z.number().min(0.01).optional(),
  expirationDate: z.string().datetime(),
  imagePath: z.string().optional(),
  usageLimitType: z.nativeEnum(UsageLimitType).default(UsageLimitType.SINGLE_USE),
  maxUsesPerUser: z.number().min(1).optional(),
  hasTimeRestrictions: z.boolean().default(false),
  validDays: z.array(z.number().min(0).max(6)).optional(),
  validStartHour: z.number().min(0).max(23).optional(),
  validEndHour: z.number().min(0).max(23).optional(),
}).refine((data) => {
  // If couponType is ONLINE_CODE, code is required and must be at least 3 characters
  if (data.couponType === CouponType.ONLINE_CODE) {
    return data.code && data.code.trim().length >= 3
  }
  // If couponType is QR_CODE, code is optional (can be empty string or undefined)
  return true
}, {
  message: "Code is required for online coupons",
  path: ["code"]
}).refine((data) => {
  // If discountType is PERCENT, discountPercentage is required
  if (data.discountType === DiscountType.PERCENT) {
    return data.discountPercentage !== undefined && data.discountPercentage >= 1 && data.discountPercentage <= 100
  }
  // If discountType is FIXED, discountAmount is required
  if (data.discountType === DiscountType.FIXED) {
    return data.discountAmount !== undefined && data.discountAmount > 0
  }
  // BOGO types don't need discount values
  return true
}, {
  message: "Discount value is required and must be valid for the selected discount type",
  path: ["discountPercentage"]
}).refine((data) => {
  // If usageLimitType is MULTIPLE_USE, maxUsesPerUser must be provided and >= 1
  if (data.usageLimitType === UsageLimitType.MULTIPLE_USE) {
    return data.maxUsesPerUser !== undefined && data.maxUsesPerUser >= 1
  }
  return true
}, {
  message: "Max uses per user is required for multiple uses",
  path: ["maxUsesPerUser"]
}).refine((data) => {
  // If hasTimeRestrictions is true, validDays must have at least one day
  if (data.hasTimeRestrictions) {
    return data.validDays && data.validDays.length > 0
  }
  return true
}, {
  message: "At least one day must be selected when time restrictions are enabled",
  path: ["validDays"]
}).refine((data) => {
  // If hasTimeRestrictions is true, both validStartHour and validEndHour must be provided
  if (data.hasTimeRestrictions) {
    return data.validStartHour !== undefined && data.validEndHour !== undefined
  }
  return true
}, {
  message: "Start hour and end hour are required when time restrictions are enabled",
  path: ["validStartHour"]
}).refine((data) => {
  // validStartHour must be < validEndHour
  if (data.hasTimeRestrictions && data.validStartHour !== undefined && data.validEndHour !== undefined) {
    return data.validStartHour < data.validEndHour
  }
  return true
}, {
  message: "Start hour must be less than end hour",
  path: ["validStartHour"]
})

// GET - List approved coupons (public) or all coupons for business/admin
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const categoryId = searchParams.get('categoryId')
    const status = searchParams.get('status')
    const businessId = searchParams.get('businessId')
    const limit = searchParams.get('limit')
    const category = searchParams.get('category') // For slug-based filtering

    // Build where clause
    const where: any = {}

    // If no specific filters, show only approved and non-expired coupons
    if (!status && !businessId) {
      where.status = CouponStatus.APPROVED
      where.expirationDate = {
        gte: new Date()
      }
    }

    if (categoryId) {
      where.categoryId = categoryId
    }

    if (category) {
      // Find category by slug
      const categoryRecord = await prisma.category.findUnique({
        where: { slug: category },
      })
      if (categoryRecord) {
        where.categoryId = categoryRecord.id
      }
    }

    if (status) {
      where.status = status
      // For approved status, also filter expired
      if (status === CouponStatus.APPROVED) {
        where.expirationDate = {
          gte: new Date()
        }
      }
    }

    if (businessId) {
      where.businessId = businessId
    }

    const take = limit ? parseInt(limit) : undefined

    const coupons = await prisma.coupon.findMany({
      where,
      take,
      include: {
        business: {
          select: {
            id: true,
            name: true,
            email: true,
            businessLocation: true,
            businessLatitude: true,
            businessLongitude: true,
          },
        },
        category: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({ coupons })
  } catch (error) {
    console.error("Error fetching coupons:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// POST - Create new coupon (business only)
export async function POST(request: NextRequest) {
  try {
    const user = await requireRole(["BUSINESS"])

    const body = await request.json()
    const validatedData = createCouponSchema.parse(body)

    // Convert empty string to undefined for optional fields
    const couponData = {
      ...validatedData,
      code: validatedData.couponType === CouponType.QR_CODE 
        ? undefined 
        : (validatedData.code && validatedData.code.trim() !== '' ? validatedData.code : undefined),
      imagePath: validatedData.imagePath && validatedData.imagePath.trim() !== '' 
        ? validatedData.imagePath 
        : undefined,
      maxUsesPerUser: validatedData.usageLimitType === UsageLimitType.MULTIPLE_USE
        ? validatedData.maxUsesPerUser
        : undefined,
      validDays: validatedData.hasTimeRestrictions && validatedData.validDays && validatedData.validDays.length > 0
        ? validatedData.validDays
        : [],
      validStartHour: validatedData.hasTimeRestrictions
        ? validatedData.validStartHour
        : undefined,
      validEndHour: validatedData.hasTimeRestrictions
        ? validatedData.validEndHour
        : undefined,
      discountPercentage: validatedData.discountType === DiscountType.PERCENT
        ? validatedData.discountPercentage
        : null,
      discountAmount: validatedData.discountType === DiscountType.FIXED
        ? validatedData.discountAmount
        : null,
      businessId: user.id,
      expirationDate: new Date(validatedData.expirationDate),
      status: CouponStatus.PENDING,
    }

    const coupon = await prisma.coupon.create({
      data: couponData,
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

    return NextResponse.json(
      { message: "Coupon created successfully", coupon },
      { status: 201 }
    )
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

    console.error("Error creating coupon:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

