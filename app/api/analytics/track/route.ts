import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const { couponId, eventType, userId } = await request.json()

    if (!couponId || !eventType) {
      return NextResponse.json(
        { error: "couponId and eventType are required" },
        { status: 400 }
      )
    }

    if (!["VIEW", "CLICK", "REDEMPTION"].includes(eventType)) {
      return NextResponse.json(
        { error: "Invalid eventType. Must be VIEW, CLICK, or REDEMPTION" },
        { status: 400 }
      )
    }

    // Verify coupon exists
    const coupon = await prisma.coupon.findUnique({
      where: { id: couponId }
    })

    if (!coupon) {
      return NextResponse.json(
        { error: "Coupon not found" },
        { status: 404 }
      )
    }

    // Get IP address and user agent
    const ipAddress = request.headers.get("x-forwarded-for") || 
                     request.headers.get("x-real-ip") || 
                     null
    const userAgent = request.headers.get("user-agent") || null

    await prisma.couponAnalytics.create({
      data: {
        couponId,
        eventType,
        userId: userId || null,
        ipAddress,
        userAgent,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error tracking event:", error)
    return NextResponse.json(
      { error: "Failed to track event" },
      { status: 500 }
    )
  }
}

