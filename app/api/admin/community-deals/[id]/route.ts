import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/auth-helpers"
import { z } from "zod"
import { CommunityDealStatus } from "@prisma/client"

const updateDealSchema = z.object({
  title: z.string().min(3).max(200).optional(),
  description: z.string().min(10).optional(),
  category: z.string().optional(),
  location: z.string().nullable().optional(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  couponCode: z.string().nullable().optional(),
  expiresAt: z.string().optional(),
  status: z.enum(["PENDING", "EXPIRED", "REPORTED", "APPROVED", "REJECTED"]).optional(),
  imageUrl: z.string().url().optional(),
  link: z.string().url().nullable().optional(),
  priceValue: z.string().nullable().optional(),
  priceType: z.enum(["EUR", "PERCENT", "ONE_PLUS_ONE", "TWO_PLUS_ONE", "FREE", "OTHER"]).nullable().optional(),
  merchantName: z.string().nullable().optional(),
  origin: z.enum(["GR", "INTERNATIONAL"]).optional(),
  startsAt: z.string().optional(),
  extraInfo: z.string().nullable().optional(),
  redeemSteps: z.string().nullable().optional(),
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
            CommunityDealVote: true,
          },
        },
      },
    })

    if (!deal) {
      return NextResponse.json({ error: "Deal not found" }, { status: 404 })
    }

    const dealWithUser = {
      ...deal,
      user: deal.User,
      User: undefined,
    }

    return NextResponse.json({ deal: dealWithUser })
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
    if (data.location !== undefined) updateData.location = data.location || "" // Convert null to empty string for online-only deals
    if (data.latitude !== undefined) updateData.latitude = data.latitude
    if (data.longitude !== undefined) updateData.longitude = data.longitude
    if (data.couponCode !== undefined) updateData.couponCode = data.couponCode
    if (data.status !== undefined) updateData.status = data.status
    if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl
    if (data.expiresAt !== undefined) {
      updateData.expiresAt = new Date(data.expiresAt)
    }
    if (data.link !== undefined) updateData.link = data.link || null
    if (data.priceValue !== undefined) updateData.priceValue = data.priceValue || null
    if (data.priceType !== undefined) updateData.priceType = data.priceType || null
    if (data.merchantName !== undefined) updateData.merchantName = data.merchantName || null
    if (data.origin !== undefined) updateData.origin = data.origin
    if (data.startsAt !== undefined) {
      updateData.startsAt = data.startsAt ? new Date(data.startsAt) : null
    }
    if (data.extraInfo !== undefined) updateData.extraInfo = data.extraInfo || null
    if (data.redeemSteps !== undefined) updateData.redeemSteps = data.redeemSteps || null

    const deal = await prisma.communityDeal.update({
      where: { id },
      data: updateData,
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

    return NextResponse.json({ deal: dealWithUser })
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

// PATCH - Update community deal (supports review actions)
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireRole(["ADMIN"])

    const { id } = await context.params
    const body = await request.json()

    console.log("PATCH request body:", body)

    const validation = updateDealSchema.safeParse(body)
    if (!validation.success) {
      console.error("Validation error:", validation.error.issues)
      const errorMessages = validation.error.issues.map((issue: any) => {
        const path = issue.path?.join('.') || 'unknown'
        return `${path}: ${issue.message}`
      }).join(', ')
      return NextResponse.json(
        { 
          error: "Invalid data", 
          issues: validation.error.issues,
          message: errorMessages
        },
        { status: 400 }
      )
    }

    const data = validation.data
    const updateData: any = {}

    if (data.title !== undefined) updateData.title = data.title
    if (data.description !== undefined) updateData.description = data.description
    if (data.category !== undefined) updateData.category = data.category
    if (data.location !== undefined) updateData.location = data.location || "" // Convert null to empty string for online-only deals
    if (data.latitude !== undefined) updateData.latitude = data.latitude
    if (data.longitude !== undefined) updateData.longitude = data.longitude
    if (data.couponCode !== undefined) updateData.couponCode = data.couponCode
    if (data.status !== undefined) updateData.status = data.status
    if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl
    if (data.expiresAt !== undefined) {
      updateData.expiresAt = new Date(data.expiresAt)
    }
    if (data.link !== undefined) updateData.link = data.link || null
    if (data.priceValue !== undefined) updateData.priceValue = data.priceValue || null
    if (data.priceType !== undefined) updateData.priceType = data.priceType || null
    if (data.merchantName !== undefined) updateData.merchantName = data.merchantName || null
    if (data.origin !== undefined) updateData.origin = data.origin
    if (data.startsAt !== undefined) {
      updateData.startsAt = data.startsAt ? new Date(data.startsAt) : null
    }
    if (data.extraInfo !== undefined) updateData.extraInfo = data.extraInfo || null
    if (data.redeemSteps !== undefined) updateData.redeemSteps = data.redeemSteps || null

    // Handle status changes (including approval/rejection)
    if (data.status !== undefined) {
      updateData.status = data.status
      // Note: reviewedByAdminId and reviewedAt fields removed - use status for approval/rejection
    }

    console.log("Update data being sent to Prisma:", JSON.stringify(updateData, null, 2))
    console.log("Deal ID:", id)

    const deal = await prisma.communityDeal.update({
      where: { id },
      data: updateData,
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

    return NextResponse.json({ deal: dealWithUser })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    console.error("Error updating community deal:", error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorStack = error instanceof Error ? error.stack : undefined
    console.error("Error details:", { errorMessage, errorStack })
    return NextResponse.json(
      { 
        error: "Internal server error",
        message: errorMessage,
        details: process.env.NODE_ENV === "development" ? errorStack : undefined
      },
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

