import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/auth-helpers"
import { z } from "zod"
import { Role } from "@prisma/client"

const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  role: z.enum(["ADMIN", "USER", "BUSINESS"]).optional(),
  membershipExpiry: z.string().datetime().nullable().optional(),
})

// GET - Get user profile by ID (admin only)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(["ADMIN"])

    const { id } = await params
    
    if (!id) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        membershipExpiry: true,
        createdAt: true,
        address: true,
        birthDate: true,
        phone: true,
        about: true,
        businessDescription: true,
        businessCategories: true, // This is a String[] array, not a relation
        businessLocation: true,
        businessWebsite: true,
        businessInstagram: true,
        businessFacebook: true,
        businessTikTok: true,
        _count: {
          select: {
            coupons: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Fetch category details if businessCategories has IDs
    let categoryDetails: any[] = []
    if (user.businessCategories && user.businessCategories.length > 0) {
      try {
        categoryDetails = await prisma.category.findMany({
          where: {
            id: {
              in: user.businessCategories,
            },
          },
          select: {
            id: true,
            nameEn: true,
            nameEl: true,
            slug: true,
          },
        })
      } catch (error) {
        console.error("Error fetching category details:", error)
        // Continue without category details
      }
    }

    return NextResponse.json({
      user: {
        ...user,
        birthDate: user.birthDate?.toISOString() ?? null,
        membershipExpiry: user.membershipExpiry?.toISOString() ?? null,
        createdAt: user.createdAt.toISOString(),
        businessCategories: categoryDetails.length > 0 ? categoryDetails : user.businessCategories,
      },
    })
  } catch (error) {
    console.error("Error fetching user profile:", error)
    
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}

// PATCH - Update user (admin only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(["ADMIN"])

    const { id } = await params
    const body = await request.json()
    const validatedData = updateUserSchema.parse(body)

    const updateData: any = {}
    if (validatedData.name) updateData.name = validatedData.name
    if (validatedData.role) updateData.role = validatedData.role as Role
    if (validatedData.membershipExpiry !== undefined) {
      updateData.membershipExpiry = validatedData.membershipExpiry 
        ? new Date(validatedData.membershipExpiry) 
        : null
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        membershipExpiry: true,
        createdAt: true,
      },
    })

    return NextResponse.json({
      message: "User updated successfully",
      user,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      )
    }

    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    console.error("Error updating user:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// DELETE - Delete user (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(["ADMIN"])

    const { id } = await params
    await prisma.user.delete({
      where: { id },
    })

    return NextResponse.json({ message: "User deleted successfully" })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    console.error("Error deleting user:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

