import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/auth-helpers"
import { CouponStatus } from "@prisma/client"

export async function POST(request: NextRequest) {
  try {
    // Only business users can redeem
    const businessUser = await requireRole(["BUSINESS"])
    const { redemptionToken } = await request.json()

    if (!redemptionToken) {
      return NextResponse.json(
        { error: "Redemption token is required" },
        { status: 400 }
      )
    }

    // Find redemption by token
    const redemption = await prisma.couponRedemption.findUnique({
      where: { redemptionToken },
      include: {
        coupon: {
          include: {
            business: true,
            category: true
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            membershipExpiry: true
          }
        }
      }
    })

    if (!redemption) {
      return NextResponse.json(
        { 
          valid: false, 
          error: "Invalid redemption token",
          message: "Μη έγκυρο QR code"
        },
        { status: 404 }
      )
    }

    // Check 1: Is coupon active?
    if (redemption.coupon.status !== CouponStatus.APPROVED) {
      return NextResponse.json(
        { 
          valid: false, 
          error: "Coupon is not approved",
          message: "Το κουπόνι δεν είναι ενεργό"
        },
        { status: 400 }
      )
    }

    if (new Date(redemption.coupon.expirationDate) < new Date()) {
      return NextResponse.json(
        { 
          valid: false, 
          error: "Coupon has expired",
          message: "Το κουπόνι έχει λήξει"
        },
        { status: 400 }
      )
    }

    // Check 2: Does user have subscription?
    if (!redemption.user.membershipExpiry || 
        new Date(redemption.user.membershipExpiry) <= new Date()) {
      return NextResponse.json(
        { 
          valid: false, 
          error: "User does not have active membership",
          message: "Ο χρήστης δεν έχει ενεργή συνδρομή"
        },
        { status: 403 }
      )
    }

    // Check 3: Has it already been redeemed?
    if (redemption.redeemedAt) {
      return NextResponse.json(
        { 
          valid: false, 
          error: "Coupon already redeemed",
          message: "Το κουπόνι έχει ήδη γίνει redeem",
          redeemedAt: redemption.redeemedAt
        },
        { status: 400 }
      )
    }

    // All checks passed - Mark as redeemed
    const updatedRedemption = await prisma.couponRedemption.update({
      where: { id: redemption.id },
      data: {
        redeemedAt: new Date()
      }
    })

    // Track analytics
    await prisma.couponAnalytics.create({
      data: {
        couponId: redemption.couponId,
        eventType: "REDEMPTION",
        userId: redemption.userId
      }
    })

    return NextResponse.json({
      valid: true,
      message: `Έκπτωση ${redemption.coupon.discountPercentage}% ενεργή 🎉`,
      coupon: {
        id: redemption.coupon.id,
        title: redemption.coupon.title,
        discountPercentage: redemption.coupon.discountPercentage
      },
      user: {
        name: redemption.user.name,
        email: redemption.user.email
      },
      redeemedAt: updatedRedemption.redeemedAt
    })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    
    console.error("Error redeeming coupon:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

