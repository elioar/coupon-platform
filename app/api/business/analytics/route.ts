import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/auth-helpers"

export async function GET(request: NextRequest) {
  try {
    const user = await requireRole(["BUSINESS"])

    const { searchParams } = new URL(request.url)
    const period = searchParams.get("period") || "30d"

    // Calculate date range
    const end = new Date()
    const start = new Date()
    const days = period === "7d" ? 7 : period === "30d" ? 30 : period === "90d" ? 90 : 365
    start.setDate(start.getDate() - days)

    const businessId = user.id

    // Get all business coupons
    const coupons = await prisma.coupon.findMany({
      where: { businessId },
      select: { id: true, title: true, category: true }
    })
    const couponIds = coupons.map(c => c.id)

    if (couponIds.length === 0) {
      return NextResponse.json({
        summary: {
          views: 0,
          clicks: 0,
          redemptions: 0,
          clickThroughRate: 0,
          redemptionRate: 0,
          overallConversion: 0
        },
        dailyData: [],
        topCoupons: [],
        categoryStats: [],
        period: { start: start.toISOString(), end: end.toISOString() }
      })
    }

    // Get analytics counts
    const [views, clicks, redemptions] = await Promise.all([
      prisma.couponAnalytics.count({
        where: {
          couponId: { in: couponIds },
          eventType: "VIEW",
          createdAt: { gte: start, lte: end }
        }
      }),
      prisma.couponAnalytics.count({
        where: {
          couponId: { in: couponIds },
          eventType: "CLICK",
          createdAt: { gte: start, lte: end }
        }
      }),
      prisma.couponAnalytics.count({
        where: {
          couponId: { in: couponIds },
          eventType: "REDEMPTION",
          createdAt: { gte: start, lte: end }
        }
      })
    ])

    // Get daily stats - group by date
    const dailyAnalytics = await prisma.couponAnalytics.findMany({
      where: {
        couponId: { in: couponIds },
        createdAt: { gte: start, lte: end }
      },
      select: {
        eventType: true,
        createdAt: true
      }
    })

    // Process daily data
    const dailyMap = new Map<string, { views: number; clicks: number; redemptions: number }>()
    for (let i = 0; i < days; i++) {
      const date = new Date(start)
      date.setDate(date.getDate() + i)
      const dateStr = date.toISOString().split('T')[0]
      dailyMap.set(dateStr, { views: 0, clicks: 0, redemptions: 0 })
    }

    dailyAnalytics.forEach(analytics => {
      const dateStr = analytics.createdAt.toISOString().split('T')[0]
      const dayData = dailyMap.get(dateStr)
      if (dayData) {
        if (analytics.eventType === "VIEW") dayData.views++
        if (analytics.eventType === "CLICK") dayData.clicks++
        if (analytics.eventType === "REDEMPTION") dayData.redemptions++
      }
    })

    const dailyData = Array.from(dailyMap.entries()).map(([date, data]) => ({
      date,
      ...data
    }))

    // Get top performing coupons
    const topCouponsAnalytics = await prisma.couponAnalytics.groupBy({
      by: ["couponId"],
      where: {
        couponId: { in: couponIds },
        eventType: "VIEW",
        createdAt: { gte: start, lte: end }
      },
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: "desc"
        }
      },
      take: 5
    })

    const topCoupons = await Promise.all(
      topCouponsAnalytics.map(async (item) => {
        const coupon = coupons.find(c => c.id === item.couponId)
        const [couponViews, couponClicks, couponRedemptions] = await Promise.all([
          prisma.couponAnalytics.count({
            where: { couponId: item.couponId, eventType: "VIEW", createdAt: { gte: start, lte: end } }
          }),
          prisma.couponAnalytics.count({
            where: { couponId: item.couponId, eventType: "CLICK", createdAt: { gte: start, lte: end } }
          }),
          prisma.couponAnalytics.count({
            where: { couponId: item.couponId, eventType: "REDEMPTION", createdAt: { gte: start, lte: end } }
          })
        ])
        return {
          id: item.couponId,
          title: coupon?.title || "Unknown",
          views: couponViews,
          clicks: couponClicks,
          redemptions: couponRedemptions
        }
      })
    )

    // Process category stats
    const categoryMap = new Map<string, { views: number; clicks: number; redemptions: number }>()
    dailyAnalytics.forEach(analytics => {
      const coupon = coupons.find(c => c.id === analytics.couponId)
      if (coupon) {
        // Use English name for consistency (can be changed based on locale if needed)
        const categoryName = coupon.category.nameEn
        if (!categoryMap.has(categoryName)) {
          categoryMap.set(categoryName, { views: 0, clicks: 0, redemptions: 0 })
        }
        const data = categoryMap.get(categoryName)!
        if (analytics.eventType === "VIEW") data.views++
        if (analytics.eventType === "CLICK") data.clicks++
        if (analytics.eventType === "REDEMPTION") data.redemptions++
      }
    })

    const categoryStats = Array.from(categoryMap.entries()).map(([category, data]) => ({
      category,
      ...data
    }))

    // Calculate conversion rates
    const clickThroughRate = views > 0 ? (clicks / views) * 100 : 0
    const redemptionRate = clicks > 0 ? (redemptions / clicks) * 100 : 0
    const overallConversion = views > 0 ? (redemptions / views) * 100 : 0

    return NextResponse.json({
      summary: {
        views,
        clicks,
        redemptions,
        clickThroughRate: Math.round(clickThroughRate * 10) / 10,
        redemptionRate: Math.round(redemptionRate * 10) / 10,
        overallConversion: Math.round(overallConversion * 10) / 10
      },
      dailyData,
      topCoupons,
      categoryStats,
      period: { start: start.toISOString(), end: end.toISOString() }
    })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    console.error("Error fetching analytics:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

