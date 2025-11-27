import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth-helpers"
import { randomBytes } from "crypto"
import { CouponStatus, UsageLimitType } from "@prisma/client"

// Ensure this runs in Node.js runtime (not edge)
export const runtime = 'nodejs'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const { id: couponId } = await params

    if (!user.id) {
      console.error("User ID is missing from session")
      return NextResponse.json(
        { error: "User ID not found" },
        { status: 401 }
      )
    }

    // Check if user has membership
    const membershipExpiry = user.membershipExpiry 
      ? (typeof user.membershipExpiry === 'string' 
          ? new Date(user.membershipExpiry) 
          : user.membershipExpiry)
      : null

    if (!membershipExpiry || membershipExpiry <= new Date()) {
      return NextResponse.json(
        { error: "Active membership required" },
        { status: 403 }
      )
    }

    // Check if coupon exists and is valid
    const coupon = await prisma.coupon.findUnique({
      where: { id: couponId }
    })

    if (!coupon) {
      return NextResponse.json(
        { error: "Coupon not found" },
        { status: 404 }
      )
    }

    if (coupon.status !== CouponStatus.APPROVED) {
      return NextResponse.json(
        { error: "Coupon is not approved" },
        { status: 400 }
      )
    }

    if (new Date(coupon.expirationDate) < new Date()) {
      return NextResponse.json(
        { error: "Coupon has expired" },
        { status: 400 }
      )
    }

    // Check usage limits based on coupon type
    if (coupon.usageLimitType === UsageLimitType.SINGLE_USE) {
      // For single use, check if user already has any redemption (redeemed or not)
      const existingRedemption = await prisma.couponRedemption.findFirst({
        where: {
          couponId: couponId,
          userId: user.id
        }
      })
      
      if (existingRedemption) {
        if (existingRedemption.redeemedAt) {
          return NextResponse.json(
            { error: "Coupon already redeemed" },
            { status: 400 }
          )
        }
        // User already has a token, return it
        return NextResponse.json({
          token: existingRedemption.redemptionToken,
          couponId: couponId,
          userId: user.id
        })
      }
    } else if (coupon.usageLimitType === UsageLimitType.MULTIPLE_USE) {
      // Count existing redemptions for this user
      const redemptionCount = await prisma.couponRedemption.count({
        where: {
          couponId: couponId,
          userId: user.id,
          redeemedAt: { not: null }
        }
      })
      
      if (coupon.maxUsesPerUser && redemptionCount >= coupon.maxUsesPerUser) {
        return NextResponse.json(
          { error: `You have reached the maximum number of uses (${coupon.maxUsesPerUser}) for this coupon` },
          { status: 400 }
        )
      }
    }
    // For UNLIMITED, no check needed - allow creating new redemption

    // Check if user has an unredeemed token (for all types, we allow new tokens)
    let redemption = await prisma.couponRedemption.findFirst({
      where: {
        couponId: couponId,
        userId: user.id,
        redeemedAt: null
      }
    })

    // If no unredeemed token exists, create one
    if (!redemption) {
      // Generate unique token - try multiple times if there's a collision
      let token: string
      let attempts = 0
      const maxAttempts = 5
      
      do {
        token = `qr_${randomBytes(32).toString('hex')}`
        attempts++
        
        // Check if token already exists
        const existing = await prisma.couponRedemption.findUnique({
          where: { redemptionToken: token }
        })
        
        if (!existing) {
          break
        }
        
        if (attempts >= maxAttempts) {
          throw new Error("Failed to generate unique token after multiple attempts")
        }
      } while (attempts < maxAttempts)
      
      try {
        redemption = await prisma.couponRedemption.create({
          data: {
            couponId: couponId,
            userId: user.id,
            redemptionToken: token,
            redeemedAt: null // Not redeemed yet
          }
        })
      } catch (createError: any) {
        // Log error and re-throw
        console.error("Error creating redemption:", createError)
        throw createError
      }
    }

    // Return token for QR code
    return NextResponse.json({
      token: redemption.redemptionToken,
      couponId: couponId,
      userId: user.id
    })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    // Log full error details for debugging
    console.error("Error generating QR token:", {
      error,
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    })
    
    return NextResponse.json(
      { 
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}

