import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { CouponStatus } from "@prisma/client"

const SETTINGS_ID = "default"

const DEFAULT_SETTINGS = {
  useRealStats: true,
  fakeTotalCoupons: 0,
  fakeActiveMembers: 0,
  fakeTotalBusinesses: 0,
  fakeTotalSavings: 0,
}

async function getOrCreateSettings() {
  return prisma.siteSettings.upsert({
    where: { id: SETTINGS_ID },
    update: {},
    create: { id: SETTINGS_ID, ...DEFAULT_SETTINGS, updatedAt: new Date() },
  })
}

export async function GET() {
  try {
    const [
      settings,
      totalCoupons,
      totalBusinesses,
      activeMembers,
    ] = await Promise.all([
      getOrCreateSettings(),
      prisma.coupon.count({
        where: {
          status: CouponStatus.APPROVED,
          expirationDate: {
            gte: new Date(),
          },
        },
      }),
      prisma.user.count({ where: { role: "BUSINESS" } }),
      prisma.user.count({
        where: {
          membershipExpiry: {
            gte: new Date(),
          },
        },
      }),
    ])

    const realStats = {
      totalCoupons,
      activeMembers,
      totalBusinesses,
      totalSavings: Math.max(0, totalCoupons * 10),
    }

    const useRealStats = settings.useRealStats ?? true

    const stats = useRealStats
      ? realStats
      : {
          totalCoupons: Math.max(0, settings.fakeTotalCoupons ?? realStats.totalCoupons),
          activeMembers: Math.max(0, settings.fakeActiveMembers ?? realStats.activeMembers),
          totalBusinesses: Math.max(0, settings.fakeTotalBusinesses ?? realStats.totalBusinesses),
          totalSavings: Math.max(0, settings.fakeTotalSavings ?? realStats.totalSavings),
        }

    return NextResponse.json({
      stats,
      mode: useRealStats ? "real" : "custom",
    })
  } catch (error) {
    console.error("Error fetching public stats:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

