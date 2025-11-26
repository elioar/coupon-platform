import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth-helpers"
import { randomBytes } from "crypto"
import { CouponStatus } from "@prisma/client"

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

    // Check if user already has a token for this coupon
    let redemption = await prisma.couponRedemption.findUnique({
      where: {
        couponId_userId: {
          couponId: couponId,
          userId: user.id
        }
      }
    })

    // If no token exists, create one
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
        // Handle unique constraint violation
        if (createError.code === 'P2002') {
          console.error("Unique constraint violation:", createError)
          // Try to fetch existing redemption
          redemption = await prisma.couponRedemption.findUnique({
            where: {
              couponId_userId: {
                couponId: couponId,
                userId: user.id
              }
            }
          })
          if (!redemption) {
            throw new Error("Failed to create or retrieve redemption")
          }
        } else {
          throw createError
        }
      }
    } else if (redemption.redeemedAt) {
      // If already redeemed, return error
      return NextResponse.json(
        { error: "Coupon already redeemed" },
        { status: 400 }
      )
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

