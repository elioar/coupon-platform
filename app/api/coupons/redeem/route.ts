import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/auth-helpers"
import { CouponStatus, UsageLimitType } from "@prisma/client"

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

    // Check 3: Has this specific redemption token already been redeemed?
    if (redemption.redeemedAt) {
      return NextResponse.json(
        { 
          valid: false, 
          error: "Coupon already redeemed",
          message: "Το κουπόνι έχει ήδη γίνει redeem",
          messageEn: "This coupon has already been redeemed",
          redeemedAt: redemption.redeemedAt
        },
        { status: 400 }
      )
    }

    // Check 4: Usage limits
    if (redemption.coupon.usageLimitType === UsageLimitType.SINGLE_USE) {
      // For SINGLE_USE, check if user has already redeemed ANY redemption for this coupon
      const existingRedeemed = await prisma.couponRedemption.findFirst({
        where: {
          couponId: redemption.couponId,
          userId: redemption.userId,
          redeemedAt: { not: null }
        }
      })
      
      if (existingRedeemed) {
        return NextResponse.json(
          { 
            valid: false, 
            error: "Usage limit reached",
            message: "Έχετε ήδη χρησιμοποιήσει αυτό το κουπόνι (μόνο μια χρήση επιτρέπεται)",
            messageEn: "You have already used this coupon (single use only)"
          },
          { status: 400 }
        )
      }
    } else if (redemption.coupon.usageLimitType === UsageLimitType.MULTIPLE_USE) {
      // Count existing redeemed redemptions for this user
      const redeemedCount = await prisma.couponRedemption.count({
        where: {
          couponId: redemption.couponId,
          userId: redemption.userId,
          redeemedAt: { not: null }
        }
      })
      
      if (redemption.coupon.maxUsesPerUser && redeemedCount >= redemption.coupon.maxUsesPerUser) {
        return NextResponse.json(
          { 
            valid: false, 
            error: "Usage limit reached",
            message: `Έχετε φτάσει το μέγιστο όριο χρήσεων (${redemption.coupon.maxUsesPerUser}) για αυτό το κουπόνι`,
            messageEn: `You have reached the maximum number of uses (${redemption.coupon.maxUsesPerUser}) for this coupon`
          },
          { status: 400 }
        )
      }
    }
    // For UNLIMITED, no check needed - allow redemption

    // Check 5: Time/day restrictions (only for QR_CODE coupons)
    if (redemption.coupon.couponType === "QR_CODE" && redemption.coupon.hasTimeRestrictions) {
      const now = new Date()
      const currentDay = now.getDay() // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
      const currentHour = now.getHours()

      // Check if current day is in validDays array
      if (!redemption.coupon.validDays || redemption.coupon.validDays.length === 0 || !redemption.coupon.validDays.includes(currentDay)) {
        const dayNamesEl = ["Κυριακή", "Δευτέρα", "Τρίτη", "Τετάρτη", "Πέμπτη", "Παρασκευή", "Σάββατο"]
        const dayNamesEn = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
        const dayNameEl = dayNamesEl[currentDay]
        const dayNameEn = dayNamesEn[currentDay]
        return NextResponse.json(
          { 
            valid: false, 
            error: "Invalid day for redemption",
            message: `Το κουπόνι δεν μπορεί να εξαργυρωθεί ${dayNameEl}`,
            messageEn: `This coupon cannot be redeemed on ${dayNameEn}`
          },
          { status: 400 }
        )
      }

      // Check if current hour is within valid range
      if (redemption.coupon.validStartHour !== null && redemption.coupon.validEndHour !== null) {
        // For end hour, we check if current hour is >= endHour (not just >)
        // This means if end hour is 18:00, redemption is allowed until 17:59:59
        if (currentHour < redemption.coupon.validStartHour || currentHour >= redemption.coupon.validEndHour) {
          const formatHour = (hour: number) => {
            return hour.toString().padStart(2, '0')
          }
          return NextResponse.json(
            { 
              valid: false, 
              error: "Invalid time for redemption",
              message: `Το κουπόνι μπορεί να εξαργυρωθεί μόνο μεταξύ ${formatHour(redemption.coupon.validStartHour)}:00 - ${formatHour(redemption.coupon.validEndHour)}:00`,
              messageEn: `This coupon can only be redeemed between ${formatHour(redemption.coupon.validStartHour)}:00 - ${formatHour(redemption.coupon.validEndHour)}:00`
            },
            { status: 400 }
          )
        }
      }
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

