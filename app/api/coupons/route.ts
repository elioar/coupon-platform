import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth, requireRole } from "@/lib/auth-helpers"
import { z } from "zod"
import { CouponStatus, CouponType } from "@prisma/client"

const createCouponSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().min(10),
  code: z.preprocess(
    (val) => (val === "" || val === null ? undefined : val),
    z.string().min(3).max(50).optional()
  ),
  couponType: z.nativeEnum(CouponType).default(CouponType.ONLINE_CODE),
  categoryId: z.string(),
  discountPercentage: z.number().min(1).max(100),
  expirationDate: z.string().datetime(),
  imagePath: z.string().optional(),
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

