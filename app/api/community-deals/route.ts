import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser, requireAuth } from "@/lib/auth-helpers"
import { z } from "zod"
import { CommunityDealStatus } from "@prisma/client"

const createCommunityDealSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().min(10),
  category: z.string().min(1),
  location: z.string().min(1),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  imageUrl: z.string().url(),
  couponCode: z.string().optional(),
  expiresAt: z.string().datetime(),
})

// GET - List active community deals (public)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const location = searchParams.get('location')
    const currentUser = await getCurrentUser()

    // Build where clause - only show active, non-expired deals
    const where: any = {
      status: CommunityDealStatus.ACTIVE,
      expiresAt: {
        gt: new Date(), // Only show deals that haven't expired
      },
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
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            comments: true,
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
      commentsCount: d._count.comments,
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
    const validatedData = createCommunityDealSchema.parse(body)

    // Validate expiration date is in the future
    const expiresAt = new Date(validatedData.expiresAt)
    if (expiresAt <= new Date()) {
      return NextResponse.json(
        { error: "Expiration date must be in the future" },
        { status: 400 }
      )
    }

    const deal = await prisma.communityDeal.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        category: validatedData.category,
        location: validatedData.location,
        latitude: validatedData.latitude,
        longitude: validatedData.longitude,
        imageUrl: validatedData.imageUrl,
        couponCode: validatedData.couponCode || null,
        expiresAt: expiresAt,
        userId: user.id,
        status: CommunityDealStatus.ACTIVE,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json({ deal }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
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

