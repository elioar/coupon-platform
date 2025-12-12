import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser, requireAuth } from "@/lib/auth-helpers"
import { z } from "zod"

const voteSchema = z.object({
  value: z.union([z.literal("UP"), z.literal("DOWN"), z.literal(1), z.literal(-1)]),
})

async function getCounts(dealId: string) {
  const [upvotesCount, downvotesCount] = await Promise.all([
    prisma.communityDealVote.count({ where: { dealId, value: 1 } }),
    prisma.communityDealVote.count({ where: { dealId, value: -1 } }),
  ])
  return { upvotesCount, downvotesCount }
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    const { id: dealId } = await context.params

    const { upvotesCount, downvotesCount } = await getCounts(dealId)

    let myVote: "UP" | "DOWN" | null = null
    if (user?.id) {
      const existing = await prisma.communityDealVote.findUnique({
        where: { dealId_userId: { dealId, userId: user.id } },
        select: { value: true },
      })
      if (existing?.value === 1) myVote = "UP"
      if (existing?.value === -1) myVote = "DOWN"
    }

    return NextResponse.json({ upvotesCount, downvotesCount, myVote }, { status: 200 })
  } catch (error) {
    console.error("Error fetching community deal vote:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const { id: dealId } = await context.params

    const body = await request.json()
    const { value } = voteSchema.parse(body)
    const nextValue = value === "UP" ? 1 : value === "DOWN" ? -1 : value

    const existing = await prisma.communityDealVote.findUnique({
      where: { dealId_userId: { dealId, userId: user.id } },
      select: { id: true, value: true },
    })

    // Toggle off if user clicks the same vote again
    if (existing && existing.value === nextValue) {
      await prisma.communityDealVote.delete({ where: { id: existing.id } })
      const counts = await getCounts(dealId)
      return NextResponse.json({ ...counts, myVote: null }, { status: 200 })
    }

    // Update if switching, else create
    await prisma.communityDealVote.upsert({
      where: { dealId_userId: { dealId, userId: user.id } },
      update: { value: nextValue },
      create: { dealId, userId: user.id, value: nextValue },
    })

    const counts = await getCounts(dealId)
    const myVote: "UP" | "DOWN" = nextValue === 1 ? "UP" : "DOWN"
    return NextResponse.json({ ...counts, myVote }, { status: 200 })
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
    console.error("Error voting on community deal:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}


