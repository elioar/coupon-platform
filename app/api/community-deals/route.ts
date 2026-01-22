import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser, requireAuth } from "@/lib/auth-helpers"
import { z } from "zod"
import { CommunityDealStatus } from "@prisma/client"
import crypto from "crypto"

const createCommunityDealSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().min(10),
  category: z.string().min(1),
  location: z.string().optional().default(""),
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
  imageUrl: z.string().url(),
  couponCode: z.preprocess((val) => (val === "" ? null : val), z.string().optional().nullable()),
  expiresAt: z.preprocess((val) => (val === "" || val === null || val === undefined ? null : val), z.string().datetime().optional().nullable()),
  link: z.preprocess((val) => {
    if (val === "" || val === null || val === undefined) return null
    if (typeof val === "string" && val.trim() === "") return null
    return val
  }, z.union([z.string().url(), z.null()]).optional().nullable()),
  priceValue: z.preprocess((val) => (val === "" ? null : val), z.string().optional().nullable()),
  priceType: z.preprocess((val) => (val === "" ? null : val), z.enum(["EUR", "PERCENT", "ONE_PLUS_ONE", "TWO_PLUS_ONE", "FREE", "OTHER"]).optional().nullable()),
  merchantName: z.preprocess((val) => (val === "" ? null : val), z.string().optional().nullable()),
  origin: z.enum(["GR", "INTERNATIONAL"]).optional().default("GR"),
  startsAt: z.preprocess((val) => (val === "" || val === null || val === undefined ? null : val), z.string().datetime().optional().nullable()),
  extraInfo: z.preprocess((val) => (val === "" ? null : val), z.string().optional().nullable()),
  redeemSteps: z.preprocess((val) => (val === "" ? null : val), z.string().optional().nullable()),
})

// GET - List active community deals (public)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const location = searchParams.get('location')
    const currentUser = await getCurrentUser()

    // Build where clause - only show approved, non-expired deals
    const where: any = {
      status: CommunityDealStatus.APPROVED, // Show only approved deals
      OR: [
        { expiresAt: null }, // Show deals with no expiration
        { expiresAt: { gt: new Date() } }, // Or deals that haven't expired
      ],
    }

    if (category) {
      where.category = category
    }

    if (location) {
      where.location = {
        contains: location,
        mode: 'insensitive',
      }
    }

    const deals = await prisma.communityDeal.findMany({
      where,
      include: {
        User: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            CommunityDealComment: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    const dealIds = deals.map((d) => d.id)

    const votes =
      dealIds.length > 0
        ? await prisma.communityDealVote.findMany({
            where: { dealId: { in: dealIds } },
            select: { dealId: true, value: true },
          })
        : []

    const upvoteMap = new Map<string, number>()
    const downvoteMap = new Map<string, number>()
    for (const v of votes) {
      if (v.value === 1) upvoteMap.set(v.dealId, (upvoteMap.get(v.dealId) ?? 0) + 1)
      if (v.value === -1) downvoteMap.set(v.dealId, (downvoteMap.get(v.dealId) ?? 0) + 1)
    }

    let myVoteMap = new Map<string, "UP" | "DOWN">()
    if (currentUser?.id && dealIds.length > 0) {
      const myVotes = await prisma.communityDealVote.findMany({
        where: { userId: currentUser.id, dealId: { in: dealIds } },
        select: { dealId: true, value: true },
      })
      myVoteMap = new Map(
        myVotes
          .filter((v) => v.value === 1 || v.value === -1)
          .map((v) => [v.dealId, v.value === 1 ? "UP" : "DOWN"] as const)
      )
    }

    const dealsWithCounts = deals.map((d) => ({
      ...d,
      user: d.User,
      User: undefined,
      commentsCount: d._count.CommunityDealComment,
      upvotesCount: upvoteMap.get(d.id) ?? 0,
      downvotesCount: downvoteMap.get(d.id) ?? 0,
      myVote: myVoteMap.get(d.id) ?? null,
      _count: undefined,
    }))

    return NextResponse.json({ deals: dealsWithCounts }, { status: 200 })
  } catch (error) {
    console.error("Error fetching community deals:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// POST - Create new community deal (authenticated users only)
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()

    const body = await request.json()
    console.log("Received body:", JSON.stringify(body, null, 2))
    const validatedData = createCommunityDealSchema.parse(body)

    // Validate expiration date is in the future if provided
    let expiresAt: Date | null = null
    if (validatedData.expiresAt) {
      expiresAt = new Date(validatedData.expiresAt)
      if (expiresAt <= new Date()) {
        return NextResponse.json(
          { error: "Expiration date must be in the future" },
          { status: 400 }
        )
      }
    }

    // Generate unique ID for the deal
    const dealId = crypto.randomBytes(16).toString("hex")

    const deal = await prisma.communityDeal.create({
      data: {
        id: dealId,
        title: validatedData.title,
        description: validatedData.description,
        category: validatedData.category,
        location: validatedData.location || "",
        latitude: validatedData.latitude ?? null,
        longitude: validatedData.longitude ?? null,
        imageUrl: validatedData.imageUrl,
        couponCode: validatedData.couponCode || null,
        expiresAt: expiresAt,
        link: validatedData.link || null,
        priceValue: validatedData.priceValue || null,
        priceType: validatedData.priceType || null,
        merchantName: validatedData.merchantName || null,
        origin: validatedData.origin || "GR",
        startsAt: validatedData.startsAt ? new Date(validatedData.startsAt) : null,
        extraInfo: validatedData.extraInfo || null,
        redeemSteps: validatedData.redeemSteps || null,
        userId: user.id,
        status: CommunityDealStatus.APPROVED, // User-submitted deals are approved by default
      },
      include: {
        User: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    const dealWithUser = {
      ...deal,
      user: deal.User,
      User: undefined,
    }

    return NextResponse.json({ deal: dealWithUser }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("Validation error details:", JSON.stringify(error.issues, null, 2))
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      )
    }

    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.error("Error creating community deal:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

