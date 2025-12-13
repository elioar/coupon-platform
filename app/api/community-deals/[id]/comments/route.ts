import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth-helpers"
import { z } from "zod"

const createCommentSchema = z.object({
  text: z.string().trim().min(1).max(100),
  parentCommentId: z.string().optional(),
})

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: dealId } = await context.params

    const comments = await prisma.communityDealComment.findMany({
      where: { dealId, parentCommentId: null },
      include: {
        user: {
          select: { id: true, name: true },
        },
        replies: {
          include: {
            user: {
              select: { id: true, name: true },
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ comments }, { status: 200 })
  } catch (error) {
    console.error("Error fetching community deal comments:", error)
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
    const validated = createCommentSchema.parse(body)

    // If parentCommentId is provided, verify it exists and belongs to the same deal
    if (validated.parentCommentId) {
      const parentComment = await prisma.communityDealComment.findFirst({
        where: {
          id: validated.parentCommentId,
          dealId,
        },
      })
      if (!parentComment) {
        return NextResponse.json({ error: "Parent comment not found" }, { status: 404 })
      }
    }

    const comment = await prisma.communityDealComment.create({
      data: {
        dealId,
        userId: user.id,
        text: validated.text,
        parentCommentId: validated.parentCommentId || null,
      },
      include: {
        user: { select: { id: true, name: true } },
      },
    })

    return NextResponse.json({ comment }, { status: 201 })
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
    console.error("Error creating community deal comment:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}


