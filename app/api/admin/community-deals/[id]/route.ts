import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/auth-helpers"
import { z } from "zod"

const updateDealSchema = z.object({
  title: z.string().min(3).max(200).optional(),
  description: z.string().min(10).optional(),
  category: z.string().optional(),
  location: z.string().optional(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  couponCode: z.string().nullable().optional(),
  expiresAt: z.string().optional(),
  status: z.enum(["ACTIVE", "EXPIRED", "REPORTED"]).optional(),
})

// GET - Get single community deal
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(["ADMIN"])

    const { id } = await context.params

    const deal = await prisma.communityDeal.findUnique({
      where: { id },
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
            votes: true,
          },
        },
      },
    })

    if (!deal) {
      return NextResponse.json({ error: "Deal not found" }, { status: 404 })
    }

    return NextResponse.json({ deal })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    console.error("Error fetching community deal:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// PUT - Update community deal
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(["ADMIN"])

    const { id } = await context.params
    const body = await request.json()

    const validation = updateDealSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid data", issues: validation.error.issues },
        { status: 400 }
      )
    }

    const data = validation.data
    const updateData: any = {}

    if (data.title !== undefined) updateData.title = data.title
    if (data.description !== undefined) updateData.description = data.description
    if (data.category !== undefined) updateData.category = data.category
    if (data.location !== undefined) updateData.location = data.location
    if (data.latitude !== undefined) updateData.latitude = data.latitude
    if (data.longitude !== undefined) updateData.longitude = data.longitude
    if (data.couponCode !== undefined) updateData.couponCode = data.couponCode
    if (data.status !== undefined) updateData.status = data.status
    if (data.expiresAt !== undefined) {
      updateData.expiresAt = new Date(data.expiresAt)
    }

    const deal = await prisma.communityDeal.update({
      where: { id },
      data: updateData,
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

    return NextResponse.json({ deal })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    console.error("Error updating community deal:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// DELETE - Delete community deal
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(["ADMIN"])

    const { id } = await context.params

    await prisma.communityDeal.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    console.error("Error deleting community deal:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

